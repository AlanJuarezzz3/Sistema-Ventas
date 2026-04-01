const express = require("express");
const router = express.Router();

const ventasController = require("../controllers/ventasController");
const verificarToken = require("../middlewares/authMiddleware");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.get("/", verificarToken, ventasController.getVentas);
router.get("/:id", verificarToken, ventasController.getVentaById);
router.post("/", verificarToken, ventasController.createVenta);
router.delete("/:id", verificarToken, verificarAdmin, ventasController.deleteVenta);

module.exports = router;