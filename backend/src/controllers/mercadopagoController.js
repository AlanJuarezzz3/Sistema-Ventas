const { MercadoPagoConfig, Preference } = require("mercadopago");
const db = require("../config/db");

const client = new MercadoPagoConfig({
  accessToken: "APP_USR-7955905703767898-040413-7ca4bd7c19c7909d174e7a248fc32015-3313855114",
  options: { timeout: 5000 }
});

const crearPago = (req, res) => {
  const { venta_id } = req.params;

  const queryVenta = `
    SELECT v.id, v.total, v.estado, c.nombre AS cliente_nombre, c.email AS cliente_email
    FROM ventas v
    JOIN clientes c ON v.cliente_id = c.id
    WHERE v.id = ?
  `;

  db.query(queryVenta, [venta_id], (err, ventaResult) => {
    if (err) {
      console.error("Error al buscar venta:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    if (ventaResult.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    const venta = ventaResult[0];

    if (venta.estado !== "activa") {
      return res.status(400).json({ mensaje: "Solo se pueden pagar ventas activas" });
    }

    const queryDetalle = `
      SELECT p.nombre, dv.cantidad, dv.precio_unitario
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
    `;

    db.query(queryDetalle, [venta_id], async (err, detalleResult) => {
      if (err) {
        console.error("Error al obtener detalle:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }

      try {
        const preference = new Preference(client);

        const response = await preference.create({
          body: {
            items: detalleResult.map((item) => ({
              id: String(item.nombre),
              title: item.nombre,
              quantity: Number(item.cantidad),
              unit_price: Number(parseFloat(item.precio_unitario).toFixed(2)),
              currency_id: "ARS",
            })),
            payer: {
              name: venta.cliente_nombre,
              email: venta.cliente_email || "test_user@test.com",
            },
            back_urls: {
              success: "https://www.google.com",
              failure: "https://www.google.com",
              pending: "https://www.google.com",
            },
            auto_return: "approved",
            external_reference: String(venta_id),
            statement_descriptor: "Sistema de Ventas",
          }
        });

        const url = response.sandbox_init_point || response.init_point;
        res.json({
          url,
          preference_id: response.id,
          qr_data: url,
        });

      } catch (error) {
        console.error("Error Mercado Pago:", error.message);
        res.status(500).json({
          mensaje: "Error al conectar con Mercado Pago",
          detalle: error.message,
        });
      }
    });
  });
};

const webhook = (req, res) => {
  const { type, data } = req.body;

  if (type === "payment") {
    const { Payment } = require("mercadopago");
    const payment = new Payment(client);
    payment.get({ id: data.id })
      .then((paymentData) => {
        if (paymentData.status === "approved") {
          const venta_id = paymentData.external_reference;
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

  res.sendStatus(200);
};

module.exports = { crearPago, webhook };