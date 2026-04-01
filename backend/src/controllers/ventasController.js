const db = require("../config/db");

const getVentas = (req, res) => {
  const query = `
    SELECT v.id, v.fecha, v.total,
           c.nombre AS cliente_nombre, c.email AS cliente_email
    FROM ventas v
    JOIN clientes c ON v.cliente_id = c.id
    ORDER BY v.fecha DESC
  `;
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error al obtener ventas:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    res.json(result);
  });
};

const getVentaById = (req, res) => {
  const { id } = req.params;

  const queryVenta = `
    SELECT v.id, v.fecha, v.total,
           c.nombre AS cliente_nombre, c.email AS cliente_email
    FROM ventas v
    JOIN clientes c ON v.cliente_id = c.id
    WHERE v.id = ?
  `;

  db.query(queryVenta, [id], (err, ventaResult) => {
    if (err) {
      console.error("Error al obtener venta:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    if (ventaResult.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    const queryDetalle = `
      SELECT dv.cantidad, dv.precio_unitario,
             p.nombre AS producto_nombre,
             (dv.cantidad * dv.precio_unitario) AS subtotal
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
    `;

    db.query(queryDetalle, [id], (err, detalleResult) => {
      if (err) {
        console.error("Error al obtener detalle de venta:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      res.json({
        ...ventaResult[0],
        detalle: detalleResult
      });
    });
  });
};

const createVenta = (req, res) => {
  const { cliente_id, productos } = req.body;

  if (!cliente_id || !productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ mensaje: "cliente_id y productos son obligatorios" });
  }

  for (const p of productos) {
    if (!p.producto_id || !p.cantidad || !p.precio_unitario) {
      return res.status(400).json({ mensaje: "Cada producto debe tener producto_id, cantidad y precio_unitario" });
    }
  }

  db.query("SELECT id FROM clientes WHERE id = ?", [cliente_id], (err, clienteResult) => {
    if (err) {
      console.error("Error al verificar cliente:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    if (clienteResult.length === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    const productoIds = productos.map((p) => p.producto_id);

    db.query(
      "SELECT id, nombre, stock FROM productos WHERE id IN (?)",
      [productoIds],
      (err, stockResult) => {
        if (err) {
          console.error("Error al verificar stock:", err);
          return res.status(500).json({ mensaje: "Error interno del servidor" });
        }

        for (const p of productos) {
          const producto = stockResult.find((s) => s.id === p.producto_id);
          if (!producto) {
            return res.status(404).json({ mensaje: `Producto ${p.producto_id} no encontrado` });
          }
          if (producto.stock < p.cantidad) {
            return res.status(400).json({
              mensaje: `Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stock}`
            });
          }
        }

        const total = productos.reduce((acc, p) => acc + p.cantidad * p.precio_unitario, 0);

        db.query(
          "INSERT INTO ventas (cliente_id, total) VALUES (?, ?)",
          [cliente_id, total],
          (err, ventaResult) => {
            if (err) {
              console.error("Error al crear venta:", err);
              return res.status(500).json({ mensaje: "Error interno del servidor" });
            }

            const venta_id = ventaResult.insertId;

            const detalle = productos.map((p) => [
              venta_id,
              p.producto_id,
              p.cantidad,
              p.precio_unitario
            ]);

            db.query(
              "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES ?",
              [detalle],
              (err) => {
                if (err) {
                  console.error("Error al insertar detalle:", err);
                  return res.status(500).json({ mensaje: "Error interno del servidor" });
                }

                const updatePromises = productos.map((p) => {
                  return new Promise((resolve, reject) => {
                    db.query(
                      "UPDATE productos SET stock = stock - ? WHERE id = ?",
                      [p.cantidad, p.producto_id],
                      (err) => {
                        if (err) reject(err);
                        else resolve();
                      }
                    );
                  });
                });

                Promise.all(updatePromises)
                  .then(() => {
                    res.status(201).json({ mensaje: "Venta creada", id: venta_id, total });
                  })
                  .catch((err) => {
                    console.error("Error al actualizar stock:", err);
                    res.status(500).json({ mensaje: "Error interno del servidor" });
                  });
              }
            );
          }
        );
      }
    );
  });
};

const deleteVenta = (req, res) => {
  const { id } = req.params;

  const queryDetalle = `
    SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?
  `;

  db.query(queryDetalle, [id], (err, detalleResult) => {
    if (err) {
      console.error("Error al obtener detalle:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }

    db.query("DELETE FROM detalle_ventas WHERE venta_id = ?", [id], (err) => {
      if (err) {
        console.error("Error al eliminar detalle:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }

      db.query("DELETE FROM ventas WHERE id = ?", [id], (err, result) => {
        if (err) {
          console.error("Error al eliminar venta:", err);
          return res.status(500).json({ mensaje: "Error interno del servidor" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ mensaje: "Venta no encontrada" });
        }

        const restorePromises = detalleResult.map((d) => {
          return new Promise((resolve, reject) => {
            db.query(
              "UPDATE productos SET stock = stock + ? WHERE id = ?",
              [d.cantidad, d.producto_id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });

        Promise.all(restorePromises)
          .then(() => {
            res.json({ mensaje: "Venta eliminada y stock restaurado" });
          })
          .catch((err) => {
            console.error("Error al restaurar stock:", err);
            res.status(500).json({ mensaje: "Error interno del servidor" });
          });
      });
    });
  });
};

module.exports = {
  getVentas,
  getVentaById,
  createVenta,
  deleteVenta
};