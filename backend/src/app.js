const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productosRoutes = require("./routes/productosRoutes");
const clientesRoutes = require("./routes/clientesRoutes");
const ventasRoutes = require("./routes/ventasRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const mercadopagoRoutes = require("./routes/mercadopagoRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Ruta base
app.get("/", (req, res) => {
  res.json({ mensaje: "API funcionando 🚀" });
});

// Rutas
app.use("/auth", authRoutes);
app.use("/productos", productosRoutes);
app.use("/clientes", clientesRoutes);
app.use("/ventas", ventasRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/pagos", mercadopagoRoutes);

// Ruta no encontrada (404 global)
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});