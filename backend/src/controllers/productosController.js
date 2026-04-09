const db = require("../config/db");

const getProductos = (req, res) => {
  db.query("SELECT * FROM productos", (err, result) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    res.json(result);
  });
};

const getCategorias = (req, res) => {
  db.query("SELECT DISTINCT categoria FROM productos WHERE categoria IS NOT NULL ORDER BY categoria", (err, result) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    res.json(result.map(r => r.categoria));
  });
};

const createProducto = (req, res) => {
  const { nombre, precio, stock, categoria } = req.body;

  if (!nombre || typeof nombre !== "string")
    return res.status(400).json({ mensaje: "Nombre inválido" });
  if (!precio || isNaN(precio))
    return res.status(400).json({ mensaje: "Precio inválido" });
  if (stock === undefined || isNaN(stock) || stock < 0)
    return res.status(400).json({ mensaje: "Stock inválido" });

  const cat = categoria?.trim() || "Sin categoría";

  db.query(
    "SELECT id FROM productos WHERE LOWER(nombre) = LOWER(?)",
    [nombre],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
      if (result.length > 0)
        return res.status(400).json({ mensaje: "Ese producto ya se encuentra agregado" });

      db.query(
        "INSERT INTO productos (nombre, precio, stock, categoria) VALUES (?, ?, ?, ?)",
        [nombre, precio, stock, cat],
        (err, result) => {
          if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
          res.status(201).json({ mensaje: "Producto creado", id: result.insertId });
        }
      );
    }
  );
};

const updateProducto = (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock, categoria } = req.body;

  if (!nombre || typeof nombre !== "string")
    return res.status(400).json({ mensaje: "Nombre inválido" });
  if (!precio || isNaN(precio))
    return res.status(400).json({ mensaje: "Precio inválido" });
  if (stock === undefined || isNaN(stock) || stock < 0)
    return res.status(400).json({ mensaje: "Stock inválido" });

  const cat = categoria?.trim() || "Sin categoría";

  db.query(
    "UPDATE productos SET nombre = ?, precio = ?, stock = ?, categoria = ? WHERE id = ?",
    [nombre, precio, stock, cat, id],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
      if (result.affectedRows === 0)
        return res.status(404).json({ mensaje: "Producto no encontrado" });
      res.json({ mensaje: "Producto actualizado" });
    }
  );
};

const deleteProducto = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM productos WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ mensaje: "Error interno del servidor" });
    if (result.affectedRows === 0)
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    res.json({ mensaje: "Producto eliminado" });
  });
};

const ajustarPrecios = (req, res) => {
  const { tipo, porcentaje, categoria } = req.body;

  if (!tipo || !['aumento', 'descuento'].includes(tipo))
    return res.status(400).json({ mensaje: "Tipo inválido. Debe ser 'aumento' o 'descuento'" });

  if (!porcentaje || isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100)
    return res.status(400).json({ mensaje: "Porcentaje inválido. Debe ser entre 1 y 100" });

  const multiplicador = tipo === 'aumento'
    ? 1 + porcentaje / 100
    : 1 - porcentaje / 100;

  const query = categoria && categoria !== 'todas'
    ? "UPDATE productos SET precio = ROUND(precio * ?, 2) WHERE categoria = ?"
    : "UPDATE productos SET precio = ROUND(precio * ?, 2)";

  const params = categoria && categoria !== 'todas'
    ? [multiplicador, categoria]
    : [multiplicador];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Error al ajustar precios:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    res.json({
      mensaje: `Precios ${tipo === 'aumento' ? 'aumentados' : 'reducidos'} un ${porcentaje}% correctamente`,
      productosAfectados: result.affectedRows
    });
  });
};

const importarProductos = (req, res) => {
  const { productos } = req.body;

  if (!productos || !Array.isArray(productos) || productos.length === 0)
    return res.status(400).json({ mensaje: "No se recibieron productos" });

  const CATEGORIAS_VALIDAS = [
    "Periféricos", "Monitores", "Componentes",
    "Gabinetes y fuentes", "Notebooks", "Accesorios", "Usados"
  ];

  const valores = productos
    .filter(p => p.nombre && typeof p.nombre === "string" && p.nombre.trim() !== "")
    .filter(p => p.precio && !isNaN(p.precio) && p.precio > 0)
    .map(p => [
      p.nombre.trim(),
      parseFloat(p.precio),
      parseInt(p.stock) || 0,
      CATEGORIAS_VALIDAS.includes(p.categoria?.trim()) ? p.categoria.trim() : "Sin categoría"
    ]);

  if (valores.length === 0)
    return res.status(400).json({ mensaje: "Ningún producto tiene datos válidos" });

  db.query(
    "INSERT IGNORE INTO productos (nombre, precio, stock, categoria) VALUES ?",
    [valores],
    (err, result) => {
      if (err) {
        console.error("Error al importar productos:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      res.status(201).json({
        mensaje: "Importación completada",
        insertados: result.affectedRows,
        duplicados: valores.length - result.affectedRows
      });
    }
  );
};

module.exports = {
  getProductos,
  getCategorias,
  createProducto,
  updateProducto,
  deleteProducto,
  ajustarPrecios,
  importarProductos
};