// Importa la conexión a la base de datos
const db = require("../config/db");

/**
 * Obtiene los datos del dashboard (KPIs y estadísticas)
 * Permite filtrar por período: dia, semana o mes (por defecto)
 */
const getDashboard = (req, res) => {
  // Obtiene el período desde query params (por defecto "mes")
  const { periodo = "mes" } = req.query;

  // Define el intervalo de tiempo según el período elegido
  let intervalo;
  if (periodo === "dia") intervalo = "INTERVAL 1 DAY";
  else if (periodo === "semana") intervalo = "INTERVAL 7 DAY";
  else intervalo = "INTERVAL 30 DAY";

  // Objeto con todas las consultas SQL necesarias para el dashboard
  const queries = {
    // Total de ventas (activas o pagadas)
    totalVentas: `SELECT COUNT(*) AS total FROM ventas WHERE estado IN ('activa', 'pagada')`,

    // Suma total de ingresos
    ingresoTotal: `SELECT COALESCE(SUM(total), 0) AS total FROM ventas WHERE estado IN ('activa', 'pagada')`,

    // Total de clientes
    totalClientes: `SELECT COUNT(*) AS total FROM clientes`,

    // Total de productos
    totalProductos: `SELECT COUNT(*) AS total FROM productos`,

    // Cantidad de productos sin stock
    productosSinStock: `SELECT COUNT(*) AS total FROM productos WHERE stock = 0`,

    // Últimas 5 ventas realizadas
    ventasRecientes: `
      SELECT v.id, v.total, v.fecha, v.estado, c.nombre AS cliente_nombre
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      WHERE v.estado IN ('activa', 'pagada')
      ORDER BY v.fecha DESC
      LIMIT 5
    `,

    // Top 5 productos más vendidos
    productosMasVendidos: `
      SELECT p.nombre, SUM(dv.cantidad) AS total_vendido
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      JOIN ventas v ON dv.venta_id = v.id
      WHERE v.estado IN ('activa', 'pagada')
      GROUP BY p.id, p.nombre
      ORDER BY total_vendido DESC
      LIMIT 5
    `,

    // Ventas agrupadas por día dentro del intervalo seleccionado
    ventasPorPeriodo: `
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m-%d') AS dia,
        COUNT(*) AS cantidad,
        COALESCE(SUM(total), 0) AS ingresos
      FROM ventas
      WHERE estado IN ('activa', 'pagada')
        AND fecha >= DATE_SUB(NOW(), ${intervalo})
      GROUP BY dia
      ORDER BY dia ASC
    `,

    // Ventas agrupadas por mes (últimos 6 meses)
    ventasPorMes: `
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') AS mes,
        COUNT(*) AS cantidad,
        SUM(total) AS ingresos
      FROM ventas
      WHERE estado IN ('activa', 'pagada')
        AND fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes ASC
    `,
  };

  // Objeto donde se guardarán los resultados de cada query
  const results = {};

  // Obtiene las claves (nombres) de las queries
  const keys = Object.keys(queries);

  // Contador de queries completadas
  let completed = 0;

  // Flag para evitar múltiples respuestas en caso de error
  let hasError = false;

  // Ejecuta cada query
  keys.forEach((key) => {
    db.query(queries[key], (err, result) => {
      // Si ya ocurrió un error, no continúa
      if (hasError) return;

      // Manejo de error en la query
      if (err) {
        hasError = true;
        console.error(`Error en query ${key}:`, err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }

      // Para métricas simples (COUNT, SUM) devuelve solo el primer resultado
      if (["totalVentas", "ingresoTotal", "totalClientes", "totalProductos", "productosSinStock"].includes(key)) {
        results[key] = result[0];
      } else {
        // Para listas o agrupaciones devuelve todo el array
        results[key] = result;
      }

      // Incrementa contador de queries completadas
      completed++;

      // Cuando todas las queries terminaron, responde con todos los datos
      if (completed === keys.length) {
        res.json({ ...results, periodo });
      }
    });
  });
};

// Exporta la función para usarla en las rutas
module.exports = { getDashboard };