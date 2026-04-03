const db = require("../config/db");

const getDashboard = (req, res) => {
  const queries = {
    totalVentas: "SELECT COUNT(*) AS total FROM ventas",
    ingresoTotal: "SELECT COALESCE(SUM(total), 0) AS total FROM ventas",
    totalClientes: "SELECT COUNT(*) AS total FROM clientes",
    totalProductos: "SELECT COUNT(*) AS total FROM productos",
    productosSinStock: "SELECT COUNT(*) AS total FROM productos WHERE stock = 0",
    ventasRecientes: `
      SELECT v.id, v.total, v.fecha, c.nombre AS cliente_nombre
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
      LIMIT 5
    `,
    productosMasVendidos: `
      SELECT p.nombre, SUM(dv.cantidad) AS total_vendido
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      GROUP BY p.id, p.nombre
      ORDER BY total_vendido DESC
      LIMIT 5
    `,
    ventasPorMes: `
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') AS mes,
        COUNT(*) AS cantidad,
        SUM(total) AS ingresos
      FROM ventas
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes ASC
    `,
  };

  const results = {};
  const keys = Object.keys(queries);
  let completed = 0;

  keys.forEach((key) => {
    db.query(queries[key], (err, result) => {
      if (err) {
        console.error(`Error en query ${key}:`, err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }

      if (key === "totalVentas" || key === "ingresoTotal" || key === "totalClientes" || key === "totalProductos" || key === "productosSinStock") {
        results[key] = result[0];
      } else {
        results[key] = result;
      }

      completed++;
      if (completed === keys.length) {
        res.json(results);
      }
    });
  });
};

module.exports = { getDashboard };