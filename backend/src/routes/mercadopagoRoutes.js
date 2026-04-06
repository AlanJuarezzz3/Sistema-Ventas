const express = require("express");
const router = express.Router();

const mercadopagoController = require("../controllers/mercadopagoController");
const verificarToken = require("../middlewares/authMiddleware");

router.post("/pagar/:venta_id", verificarToken, mercadopagoController.crearPago);
router.post("/webhook", mercadopagoController.webhook);

module.exports = router;