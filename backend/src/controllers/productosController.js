const db = require("../config/db");

const getProductos = (req, res) => {
  db.query("SELECT * FROM productos", (err, result) => {
    if (err) {
      console.error("Error al obtener productos:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    res.json(result);
  });
};

const createProducto = (req, res) => {
  const { nombre, precio, stock } = req.body;

  if (!nombre || typeof nombre !== "string") {
    return res.status(400).json({ mensaje: "Nombre inválido" });
  }

  if (!precio || isNaN(precio)) {
    return res.status(400).json({ mensaje: "Precio inválido" });
  }

  if (stock === undefined || isNaN(stock) || stock < 0) {
    return res.status(400).json({ mensaje: "Stock inválido" });
  }

  db.query(
    "INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)",
    [nombre, precio, stock],
    (err, result) => {
      if (err) {
        console.error("Error al crear producto:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      res.status(201).json({ mensaje: "Producto creado", id: result.insertId });
    }
  );
};

const updateProducto = (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock } = req.body;

  if (!nombre || typeof nombre !== "string") {
    return res.status(400).json({ mensaje: "Nombre inválido" });
  }

  if (!precio || isNaN(precio)) {
    return res.status(400).json({ mensaje: "Precio inválido" });
  }

  if (stock === undefined || isNaN(stock) || stock < 0) {
    return res.status(400).json({ mensaje: "Stock inválido" });
  }

  db.query(
    "UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?",
    [nombre, precio, stock, id],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar producto:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Producto no encontrado" });
      }
      res.json({ mensaje: "Producto actualizado" });
    }
  );
};

const deleteProducto = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM productos WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Error al eliminar producto:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Producto no encontrado" });
      }
      res.json({ mensaje: "Producto eliminado" });
    }
  );
};

module.exports = {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto
};