const db = require("../config/db");

const getDashboard = (req, res) => {
  const { periodo = "mes" } = req.query;

  let intervalo;
  if (periodo === "dia") intervalo = "INTERVAL 1 DAY";
  else if (periodo === "semana") intervalo = "INTERVAL 7 DAY";
  else intervalo = "INTERVAL 30 DAY";

  const queries = {
    totalVentas: `SELECT COUNT(*) AS total FROM ventas WHERE estado = 'activa'`,
    ingresoTotal: `SELECT COALESCE(SUM(total), 0) AS total FROM ventas WHERE estado = 'activa'`,
    totalClientes: `SELECT COUNT(*) AS total FROM clientes`,
    totalProductos: `SELECT COUNT(*) AS total FROM productos`,
    productosSinStock: `SELECT COUNT(*) AS total FROM productos WHERE stock = 0`,
    ventasRecientes: `
      SELECT v.id, v.total, v.fecha, c.nombre AS cliente_nombre
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      WHERE v.estado = 'activa'
      ORDER BY v.fecha DESC
      LIMIT 5
    `,
    productosMasVendidos: `
      SELECT p.nombre, SUM(dv.cantidad) AS total_vendido
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      JOIN ventas v ON dv.venta_id = v.id
      WHERE v.estado = 'activa'
      GROUP BY p.id, p.nombre
      ORDER BY total_vendido DESC
      LIMIT 5
    `,
    ventasPorPeriodo: `
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m-%d') AS dia,
        COUNT(*) AS cantidad,
        COALESCE(SUM(total), 0) AS ingresos
      FROM ventas
      WHERE estado = 'activa'
        AND fecha >= DATE_SUB(NOW(), ${intervalo})
      GROUP BY dia
      ORDER BY dia ASC
    `,
    ventasPorMes: `
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') AS mes,
        COUNT(*) AS cantidad,
        SUM(total) AS ingresos
      FROM ventas
      WHERE estado = 'activa'
        AND fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes ASC
    `,
  };

  const results = {};
  const keys = Object.keys(queries);
  let completed = 0;
  let hasError = false;

  keys.forEach((key) => {
    db.query(queries[key], (err, result) => {
      if (hasError) return;
      if (err) {
        hasError = true;
        console.error(`Error en query ${key}:`, err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }

      if (["totalVentas", "ingresoTotal", "totalClientes", "totalProductos", "productosSinStock"].includes(key)) {
        results[key] = result[0];
      } else {
        results[key] = result;
      }

      completed++;
      if (completed === keys.length) {
        res.json({ ...results, periodo });
      }
    });
  });
};

module.exports = { getDashboard };