// Importa las clases necesarias del SDK de Mercado Pago
const { MercadoPagoConfig, Preference } = require("mercadopago");

// Importa la conexión a la base de datos
const db = require("../config/db");

// Configuración del cliente de Mercado Pago con el access token
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-7955905703767898-040413-7ca4bd7c19c7909d174e7a248fc32015-3313855114",
  options: { timeout: 5000 } // Tiempo máximo de espera para requests (ms)
});

/**
 * Crea una preferencia de pago en Mercado Pago a partir de una venta
 * Recibe el ID de la venta por parámetro (req.params)
 */
const crearPago = (req, res) => {
  const { venta_id } = req.params;

  // Consulta para obtener datos de la venta junto con datos del cliente
  const queryVenta = `
    SELECT v.id, v.total, v.estado, c.nombre AS cliente_nombre, c.email AS cliente_email
    FROM ventas v
    JOIN clientes c ON v.cliente_id = c.id
    WHERE v.id = ?
  `;

  // Ejecuta la consulta de la venta
  db.query(queryVenta, [venta_id], (err, ventaResult) => {
    if (err) {
      console.error("Error al buscar venta:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }

    // Si no se encuentra la venta
    if (ventaResult.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    const venta = ventaResult[0];

    // Solo se permiten pagos de ventas en estado "activa"
    if (venta.estado !== "activa") {
      return res.status(400).json({ mensaje: "Solo se pueden pagar ventas activas" });
    }

    // Consulta para obtener el detalle de productos de la venta
    const queryDetalle = `
      SELECT p.nombre, dv.cantidad, dv.precio_unitario
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
    `;

    // Ejecuta la consulta del detalle de la venta
    db.query(queryDetalle, [venta_id], async (err, detalleResult) => {
      if (err) {
        console.error("Error al obtener detalle:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }

      try {
        // Crea una instancia de preferencia de pago
        const preference = new Preference(client);

        // Crea la preferencia en Mercado Pago
        const response = await preference.create({
          body: {
            // Mapea cada producto del detalle a un item de Mercado Pago
            items: detalleResult.map((item) => ({
              id: String(item.nombre), // ID del ítem (usando nombre como identificador)
              title: item.nombre, // Nombre del producto
              quantity: Number(item.cantidad), // Cantidad
              unit_price: Number(parseFloat(item.precio_unitario).toFixed(2)), // Precio unitario formateado
              currency_id: "ARS", // Moneda (pesos argentinos)
            })),

            // Datos del pagador (cliente)
            payer: {
              name: venta.cliente_nombre,
              email: venta.cliente_email || "test_user@test.com", // Email fallback si no existe
            },

            // URLs de redirección después del pago
            back_urls: {
              success: "https://www.google.com",
              failure: "https://www.google.com",
              pending: "https://www.google.com",
            },

            auto_return: "approved", // Retorno automático cuando el pago es aprobado

            external_reference: String(venta_id), // Referencia externa para identificar la venta

            statement_descriptor: "Sistema de Ventas", // Texto que aparece en el resumen del pago
          }
        });

        // Obtiene la URL de pago (sandbox o producción)
        const url = response.sandbox_init_point || response.init_point;

        // Devuelve la información necesaria al frontend
        res.json({
          url, // URL para redirigir al pago
          preference_id: response.id, // ID de la preferencia
          qr_data: url, // Puede usarse para generar un QR
        });

      } catch (error) {
        // Manejo de errores al comunicarse con Mercado Pago
        console.error("Error Mercado Pago:", error.message);
        res.status(500).json({
          mensaje: "Error al conectar con Mercado Pago",
          detalle: error.message,
        });
      }
    });
  });
};

/**
 * Webhook de Mercado Pago
 * Recibe notificaciones automáticas cuando cambia el estado de un pago
 */
const webhook = (req, res) => {
  const { type, data } = req.body;

  // Solo procesa eventos de tipo "payment"
  if (type === "payment") {
    const { Payment } = require("mercadopago");

    // Crea instancia para consultar el pago
    const payment = new Payment(client);

    // Obtiene información del pago desde Mercado Pago
    payment.get({ id: data.id })
      .then((paymentData) => {

        // Si el pago fue aprobado
        if (paymentData.status === "approved") {
          const venta_id = paymentData.external_reference;

          // Actualiza la venta como "pagada" en la base de datos
          db.query(
            "UPDATE ventas SET estado = 'pagada' WHERE id = ? AND estado = 'activa'",
            [venta_id],
            (err) => {
              if (err) console.error("Error al marcar venta como pagada:", err);
              else console.log(`Venta ${venta_id} marcada como pagada`);
            }
          );
        }
      })
      .catch((err) => console.error("Error al obtener pago:", err));
  }

  // Responde siempre 200 para que Mercado Pago no reintente el webhook
  res.sendStatus(200);
};

// Exporta las funciones para ser usadas en las rutas
module.exports = { crearPago, webhook };