const express = require("express");
const router = express.Router();
const productosController = require("../controllers/productosController");
const verificarToken = require("../middlewares/authMiddleware");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.get("/", verificarToken, productosController.getProductos);
router.get("/categorias", verificarToken, productosController.getCategorias);
router.put("/ajustar-precios", verificarToken, verificarAdmin, productosController.ajustarPrecios);
router.post("/importar", verificarToken, verificarAdmin, productosController.importarProductos);
router.post("/", verificarToken, verificarAdmin, productosController.createProducto);
router.put("/:id", verificarToken, verificarAdmin, productosController.updateProducto);
router.delete("/:id", verificarToken, verificarAdmin, productosController.deleteProducto);

module.exports = router;