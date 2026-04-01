const express = require("express");
const router = express.Router();

const usuariosController = require("../controllers/usuariosController");
const verificarToken = require("../middlewares/authMiddleware");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.get("/", verificarToken, verificarAdmin, usuariosController.getUsuarios);
router.post("/", verificarToken, verificarAdmin, usuariosController.createUsuario);
router.delete("/:id", verificarToken, verificarAdmin, usuariosController.deleteUsuario);

module.exports = router;