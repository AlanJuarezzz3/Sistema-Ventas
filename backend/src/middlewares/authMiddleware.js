const jwt = require("jsonwebtoken");

const SECRET_KEY = "clave_secreta_123";

const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ mensaje: "Formato de token inválido" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ mensaje: "Token inválido o expirado" });
    }

    req.usuario = decoded;
    next();
  });
};

module.exports = verificarToken;