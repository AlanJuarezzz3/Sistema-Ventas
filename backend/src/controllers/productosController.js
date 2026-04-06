/**
 * productosController.js — Controlador de productos
 *
 * Maneja todas las operaciones CRUD sobre la tabla productos.
 * Incluye validaciones de datos antes de insertar o actualizar.
 * El campo stock se agregó para controlar el inventario disponible.
 * Al crear un producto verifica que no exista otro con el mismo nombre (case insensitive).
 */

const db = require("../config/db");

/**
 * getProductos — Obtiene todos los productos
 * GET /productos
 */
const getProductos = (req, res) => {
  db.query("SELECT * FROM productos", (err, result) => {
    if (err) {
      console.error("Error al obtener productos:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    res.json(result);
  });
};

/**
 * createProducto — Crea un nuevo producto
 * Verifica que no exista otro producto con el mismo nombre antes de insertar.
 * POST /productos
 */
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

  // Verifica que no exista un producto con el mismo nombre (sin importar mayúsculas)
  db.query(
    "SELECT id FROM productos WHERE LOWER(nombre) = LOWER(?)",
    [nombre],
    (err, result) => {
      if (err) {
        console.error("Error al verificar producto:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      if (result.length > 0) {
        return res.status(400).json({ mensaje: "Ese producto ya se encuentra agregado" });
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
    }
  );
};

/**
 * updateProducto — Actualiza nombre, precio y stock de un producto
 * PUT /productos/:id
 */
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

/**
 * deleteProducto — Elimina un producto por ID
 * Solo el admin puede eliminar productos (controlado por el middleware verificarAdmin).
 * DELETE /productos/:id
 */
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