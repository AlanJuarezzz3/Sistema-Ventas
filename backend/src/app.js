/**
 * app.js — Punto de entrada del servidor Express
 * Configura middlewares, registra todas las rutas y maneja errores globales.
 */

const express = require("express");
const cors = require("cors");

// Importación de rutas
const authRoutes = require("./routes/authRoutes");
const productosRoutes = require("./routes/productosRoutes");
const clientesRoutes = require("./routes/clientesRoutes");
const ventasRoutes = require("./routes/ventasRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const mercadopagoRoutes = require("./routes/mercadopagoRoutes");

const app = express();

// Middlewares globales
app.use(cors()); // Permite requests desde el frontend (localhost:5173)
app.use(express.json()); // Parsea el body de las requests como JSON

// Ruta base — verifica que el servidor esté corriendo
app.get("/", (req, res) => {
  res.json({ mensaje: "API funcionando 🚀" });
});

// Registro de rutas
app.use("/auth", authRoutes);           // POST /auth/login, POST /auth/register
app.use("/productos", productosRoutes); // CRUD de productos
app.use("/clientes", clientesRoutes);   // CRUD de clientes + historial
app.use("/ventas", ventasRoutes);       // CRUD de ventas + anular + marcar pagada
app.use("/usuarios", usuariosRoutes);   // CRUD de usuarios (solo admin)
app.use("/dashboard", dashboardRoutes); // Métricas y estadísticas
app.use("/pagos", mercadopagoRoutes);   // Integración con Mercado Pago

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Manejo de errores globales no capturados en los controllers
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});