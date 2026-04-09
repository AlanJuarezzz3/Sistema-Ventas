const db = require("../config/db");

const getVentas = (req, res) => {
  const query = `
    SELECT v.id, v.fecha, v.total, v.estado,
           c.nombre AS cliente_nombre, c.email AS cliente_email,
           u.nombre AS vendedor_nombre
    FROM ventas v
    JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN usuarios u ON v.usuario_id = u.id
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
    SELECT v.id, v.fecha, v.total, v.estado,
           c.nombre AS cliente_nombre, c.email AS cliente_email,
           u.nombre AS vendedor_nombre
    FROM ventas v
    JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN usuarios u ON v.usuario_id = u.id
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
  const usuario_id = req.usuario?.id || null;

  if (!cliente_id || !productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ mensaje: "cliente_id y productos son obligatorios" });
  }

  for (const p of productos) {
    if (!p.producto_id || !p.cantidad || !p.precio_unitario) {
      return res.status(400).json({ mensaje: "Cada producto debe tener producto_id, cantidad y precio_unitario" });
    }
  }

  db.query("SELECT id FROM clientes WHERE id = ?", [cliente_id], (err, clienteResult) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    if (clienteResult.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });

    const productoIds = productos.map((p) => p.producto_id);

    db.query(
      "SELECT id, nombre, stock FROM productos WHERE id IN (?)",
      [productoIds],
      (err, stockResult) => {
        if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });

        for (const p of productos) {
          const producto = stockResult.find((s) => s.id === p.producto_id);
          if (!producto) return res.status(404).json({ mensaje: `Producto ${p.producto_id} no encontrado` });
          if (producto.stock < p.cantidad) {
            return res.status(400).json({
              mensaje: `Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stock}`
            });
          }
        }

        const total = productos.reduce((acc, p) => acc + p.cantidad * p.precio_unitario, 0);

        db.query(
          "INSERT INTO ventas (cliente_id, total, usuario_id) VALUES (?, ?, ?)",
          [cliente_id, total, usuario_id],
          (err, ventaResult) => {
            if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });

            const venta_id = ventaResult.insertId;
            const detalle = productos.map((p) => [venta_id, p.producto_id, p.cantidad, p.precio_unitario]);

            db.query(
              "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES ?",
              [detalle],
              (err) => {
                if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });

                const updatePromises = productos.map((p) => {
                  return new Promise((resolve, reject) => {
                    db.query(
                      "UPDATE productos SET stock = stock - ? WHERE id = ?",
                      [p.cantidad, p.producto_id],
                      (err) => { if (err) reject(err); else resolve(); }
                    );
                  });
                });

                Promise.all(updatePromises)
                  .then(() => res.status(201).json({ mensaje: "Venta creada", id: venta_id, total }))
                  .catch(() => res.status(500).json({ mensaje: "Error interno del servidor" }));
              }
            );
          }
        );
      }
    );
  });
};

const anularVenta = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM ventas WHERE id = ?", [id], (err, ventaResult) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    if (ventaResult.length === 0) return res.status(404).json({ mensaje: "Venta no encontrada" });
    if (ventaResult[0].estado === "anulada") return res.status(400).json({ mensaje: "La venta ya está anulada" });
    if (ventaResult[0].estado === "pagada") return res.status(400).json({ mensaje: "No se puede anular una venta pagada" });

    db.query(
      "SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?",
      [id],
      (err, detalleResult) => {
        if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });

        db.query("UPDATE ventas SET estado = 'anulada' WHERE id = ?", [id], (err) => {
          if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });

          const restorePromises = detalleResult.map((d) => {
            return new Promise((resolve, reject) => {
              db.query(
                "UPDATE productos SET stock = stock + ? WHERE id = ?",
                [d.cantidad, d.producto_id],
                (err) => { if (err) reject(err); else resolve(); }
              );
            });
          });

          Promise.all(restorePromises)
            .then(() => res.json({ mensaje: "Venta anulada y stock restaurado" }))
            .catch(() => res.status(500).json({ mensaje: "Error interno del servidor" }));
        });
      }
    );
  });
};

const marcarPagada = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM ventas WHERE id = ?", [id], (err, ventaResult) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    if (ventaResult.length === 0) return res.status(404).json({ mensaje: "Venta no encontrada" });
    if (ventaResult[0].estado !== "activa") return res.status(400).json({ mensaje: "Solo se pueden marcar como pagadas las ventas activas" });

    db.query("UPDATE ventas SET estado = 'pagada' WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
      res.json({ mensaje: "Venta marcada como pagada" });
    });
  });
};

const eliminarVenta = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM ventas WHERE id = ?", [id], (err, ventaResult) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    if (ventaResult.length === 0) return res.status(404).json({ mensaje: "Venta no encontrada" });
    if (ventaResult[0].estado !== "anulada") return res.status(400).json({ mensaje: "Solo se pueden eliminar ventas anuladas" });

    db.query("DELETE FROM detalle_ventas WHERE venta_id = ?", [id], (err) => {
      if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });

      db.query("DELETE FROM ventas WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: "Venta no encontrada" });
        res.json({ mensaje: "Venta eliminada definitivamente" });
      });
    });
  });
};

module.exports = {
  getVentas,
  getVentaById,
  createVenta,
  anularVenta,
  marcarPagada,
  eliminarVenta,
};