/**
 * ventasController.js — Controlador de ventas
 *
 * Maneja todas las operaciones sobre la tabla ventas y detalle_ventas.
 * Una venta puede tener tres estados:
 *   - activa: venta registrada pero no pagada
 *   - pagada: venta confirmada y cobrada
 *   - anulada: venta cancelada, el stock se restaura automáticamente
 *
 * Reglas de negocio importantes:
 *   - Al crear una venta se descuenta el stock de cada producto
 *   - Al anular una venta se restaura el stock de cada producto
 *   - Una venta pagada NO se puede anular
 *   - Solo se pueden eliminar ventas que estén anuladas
 *   - Al eliminar una venta se borra también su detalle
 */

const db = require("../config/db");

/**
 * getVentas — Obtiene todas las ventas con datos del cliente
 * Usa JOIN con clientes para devolver nombre y email del cliente.
 * Ordena por fecha descendente (más reciente primero).
 * GET /ventas
 */
const getVentas = (req, res) => {
  const query = `
    SELECT v.id, v.fecha, v.total, v.estado,
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

/**
 * getVentaById — Obtiene una venta con su detalle completo de productos
 * Hace dos queries: una para la venta y otra para el detalle.
 * El detalle incluye nombre del producto, cantidad, precio unitario y subtotal.
 * GET /ventas/:id
 */
const getVentaById = (req, res) => {
  const { id } = req.params;

  const queryVenta = `
    SELECT v.id, v.fecha, v.total, v.estado,
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

/**
 * createVenta — Crea una nueva venta con su detalle de productos
 * Flujo:
 *   1. Valida que el cliente exista
 *   2. Verifica que haya stock suficiente para cada producto
 *   3. Calcula el total sumando cantidad * precio_unitario de cada item
 *   4. Inserta la venta en la tabla ventas
 *   5. Inserta el detalle en detalle_ventas (bulk insert)
 *   6. Descuenta el stock de cada producto usando Promise.all
 * POST /ventas
 */
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

    // Verifica el stock disponible de todos los productos de la venta
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

            // Prepara el bulk insert para detalle_ventas
            const detalle = productos.map((p) => [
              venta_id, p.producto_id, p.cantidad, p.precio_unitario
            ]);

            db.query(
              "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES ?",
              [detalle],
              (err) => {
                if (err) {
                  console.error("Error al insertar detalle:", err);
                  return res.status(500).json({ mensaje: "Error interno del servidor" });
                }

                // Descuenta el stock de cada producto en paralelo
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

/**
 * anularVenta — Cambia el estado de una venta a "anulada"
 * Restaura el stock de cada producto involucrado en la venta.
 * No se puede anular una venta que ya está pagada.
 * Solo el admin puede anular ventas (controlado por verificarAdmin).
 * PUT /ventas/:id/anular
 */
const anularVenta = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM ventas WHERE id = ?", [id], (err, ventaResult) => {
    if (err) {
      console.error("Error al buscar venta:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    if (ventaResult.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    if (ventaResult[0].estado === "anulada") {
      return res.status(400).json({ mensaje: "La venta ya está anulada" });
    }
    if (ventaResult[0].estado === "pagada") {
      return res.status(400).json({ mensaje: "No se puede anular una venta pagada" });
    }

    db.query(
      "SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?",
      [id],
      (err, detalleResult) => {
        if (err) {
          console.error("Error al obtener detalle:", err);
          return res.status(500).json({ mensaje: "Error interno del servidor" });
        }

        db.query("UPDATE ventas SET estado = 'anulada' WHERE id = ?", [id], (err) => {
          if (err) {
            console.error("Error al anular venta:", err);
            return res.status(500).json({ mensaje: "Error interno del servidor" });
          }

          // Restaura el stock de cada producto en paralelo
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
            .catch((err) => {
              console.error("Error al restaurar stock:", err);
              res.status(500).json({ mensaje: "Error interno del servidor" });
            });
        });
      }
    );
  });
};

/**
 * marcarPagada — Cambia el estado de una venta a "pagada"
 * Se usa cuando el pago se confirma manualmente o via webhook de Mercado Pago.
 * Solo se pueden marcar como pagadas las ventas activas.
 * PUT /ventas/:id/pagada
 */
const marcarPagada = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM ventas WHERE id = ?", [id], (err, ventaResult) => {
    if (err) {
      console.error("Error al buscar venta:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    if (ventaResult.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    if (ventaResult[0].estado !== "activa") {
      return res.status(400).json({ mensaje: "Solo se pueden marcar como pagadas las ventas activas" });
    }

    db.query("UPDATE ventas SET estado = 'pagada' WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Error al marcar venta como pagada:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      res.json({ mensaje: "Venta marcada como pagada" });
    });
  });
};

/**
 * eliminarVenta — Elimina definitivamente una venta y su detalle
 * Solo se pueden eliminar ventas que estén anuladas.
 * Primero elimina el detalle (detalle_ventas) y luego la venta.
 * El stock NO se modifica porque ya fue restaurado al anular.
 * DELETE /ventas/:id
 */
const eliminarVenta = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM ventas WHERE id = ?", [id], (err, ventaResult) => {
    if (err) {
      console.error("Error al buscar venta:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    if (ventaResult.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    if (ventaResult[0].estado !== "anulada") {
      return res.status(400).json({ mensaje: "Solo se pueden eliminar ventas anuladas" });
    }

    // Primero elimina el detalle para respetar la foreign key
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