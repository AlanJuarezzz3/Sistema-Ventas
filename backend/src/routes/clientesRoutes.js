const express = require("express");
const router = express.Router();

const clientesController = require("../controllers/clientesController");
const verificarToken = require("../middlewares/authMiddleware");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.get("/", verificarToken, clientesController.getClientes);
router.get("/:id", verificarToken, clientesController.getClienteById);
router.get("/:id/historial", verificarToken, clientesController.getHistorialCliente);
router.post("/", verificarToken, clientesController.createCliente);
router.put("/:id", verificarToken, verificarAdmin, clientesController.updateCliente);
router.delete("/:id", verificarToken, verificarAdmin, clientesController.deleteCliente);

module.exports = router;