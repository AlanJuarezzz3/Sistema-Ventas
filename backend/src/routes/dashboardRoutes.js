const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const verificarToken = require("../middlewares/authMiddleware");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.get("/", verificarToken, verificarAdmin, dashboardController.getDashboard);

module.exports = router;