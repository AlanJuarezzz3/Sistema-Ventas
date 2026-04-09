const db = require("../config/db");

const getClientes = (req, res) => {
  db.query("SELECT * FROM clientes", (err, result) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    res.json(result);
  });
};

const getClienteById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM clientes WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    if (result.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
    res.json(result[0]);
  });
};

const createCliente = (req, res) => {
  const { nombre, email, telefono } = req.body;
  if (!nombre || typeof nombre !== "string")
    return res.status(400).json({ mensaje: "Nombre inválido" });

  db.query(
    "INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)",
    [nombre, email || null, telefono || null],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
      res.status(201).json({ mensaje: "Cliente creado", id: result.insertId });
    }
  );
};

const updateCliente = (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono } = req.body;
  if (!nombre || typeof nombre !== "string")
    return res.status(400).json({ mensaje: "Nombre inválido" });

  db.query(
    "UPDATE clientes SET nombre = ?, email = ?, telefono = ? WHERE id = ?",
    [nombre, email || null, telefono || null, id],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
      if (result.affectedRows === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
      res.json({ mensaje: "Cliente actualizado" });
    }
  );
};

const deleteCliente = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM clientes WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    if (result.affectedRows === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
    res.json({ mensaje: "Cliente eliminado" });
  });
};

const getHistorialCliente = (req, res) => {
  const { id } = req.params;

  db.query("SELECT id, nombre FROM clientes WHERE id = ?", [id], (err, clienteResult) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    if (clienteResult.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });

    const query = `
      SELECT 
        v.id, v.fecha, v.total, v.estado,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'producto', p.nombre,
            'cantidad', dv.cantidad,
            'precio_unitario', dv.precio_unitario,
            'subtotal', dv.cantidad * dv.precio_unitario
          )
        ) AS detalle
      FROM ventas v
      JOIN detalle_ventas dv ON v.id = dv.venta_id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.cliente_id = ?
      GROUP BY v.id, v.fecha, v.total, v.estado
      ORDER BY v.fecha DESC
    `;

    db.query(query, [id], (err, ventasResult) => {
      if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
      res.json({
        cliente: clienteResult[0],
        ventas: ventasResult.map((v) => ({
          ...v,
          detalle: typeof v.detalle === "string" ? JSON.parse(v.detalle) : v.detalle
        }))
      });
    });
  });
};

const importarClientes = (req, res) => {
  const { clientes } = req.body;

  if (!clientes || !Array.isArray(clientes) || clientes.length === 0)
    return res.status(400).json({ mensaje: "No se recibieron clientes" });

  const valores = clientes
    .filter(c => c.nombre && typeof c.nombre === "string" && c.nombre.trim() !== "")
    .map(c => [c.nombre.trim(), c.email?.trim() || null, c.telefono?.toString().trim() || null]);

  if (valores.length === 0)
    return res.status(400).json({ mensaje: "Ningún cliente tiene nombre válido" });

  db.query(
    "INSERT IGNORE INTO clientes (nombre, email, telefono) VALUES ?",
    [valores],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
      res.status(201).json({
        mensaje: "Importación completada",
        insertados: result.affectedRows,
        duplicados: valores.length - result.affectedRows
      });
    }
  );
};

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  getHistorialCliente,
  importarClientes
};