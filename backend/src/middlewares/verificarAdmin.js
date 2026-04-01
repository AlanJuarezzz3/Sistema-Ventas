const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores." });
  }
  next();
};

module.exports = verificarAdmin;