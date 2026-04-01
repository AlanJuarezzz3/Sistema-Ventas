const db = require("../config/db");

const getClientes = (req, res) => {
  db.query("SELECT * FROM clientes", (err, result) => {
    if (err) {
      console.error("Error al obtener clientes:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    res.json(result);
  });
};

const getClienteById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM clientes WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Error al obtener cliente:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    if (result.length === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    res.json(result[0]);
  });
};

const createCliente = (req, res) => {
  const { nombre, email, telefono } = req.body;

  if (!nombre || typeof nombre !== "string") {
    return res.status(400).json({ mensaje: "Nombre inválido" });
  }

  db.query(
    "INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)",
    [nombre, email || null, telefono || null],
    (err, result) => {
      if (err) {
        console.error("Error al crear cliente:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      res.status(201).json({ mensaje: "Cliente creado", id: result.insertId });
    }
  );
};

const updateCliente = (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono } = req.body;

  if (!nombre || typeof nombre !== "string") {
    return res.status(400).json({ mensaje: "Nombre inválido" });
  }

  db.query(
    "UPDATE clientes SET nombre = ?, email = ?, telefono = ? WHERE id = ?",
    [nombre, email || null, telefono || null, id],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar cliente:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Cliente no encontrado" });
      }
      res.json({ mensaje: "Cliente actualizado" });
    }
  );
};

const deleteCliente = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM clientes WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Error al eliminar cliente:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Cliente no encontrado" });
      }
      res.json({ mensaje: "Cliente eliminado" });
    }
  );
};

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
};