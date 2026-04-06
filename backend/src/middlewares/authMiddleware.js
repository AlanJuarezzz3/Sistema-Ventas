/**
 * authMiddleware.js — Middleware de autenticación JWT
 *
 * Verifica que cada request a rutas protegidas incluya un token JWT válido.
 * El token se envía en el header Authorization con el formato: "Bearer <token>"
 *
 * Si el token es válido, agrega los datos del usuario (id, email, rol)
 * en req.usuario para que los controllers puedan acceder a ellos.
 *
 * Flujo:
 * 1. Extrae el header Authorization
 * 2. Separa el token del prefijo "Bearer"
 * 3. Verifica el token con la clave secreta
 * 4. Si es válido, pasa al siguiente middleware o controller (next())
 * 5. Si no es válido, devuelve 401 o 403
 */

const jwt = require("jsonwebtoken");

const SECRET_KEY = "clave_secreta_123";

const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Verifica que el header Authorization exista
  if (!authHeader) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  // Extrae el token del formato "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ mensaje: "Formato de token inválido" });
  }

  // Verifica la validez del token y su firma
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ mensaje: "Token inválido o expirado" });
    }

    // Adjunta los datos del usuario decodificados al objeto request
    req.usuario = decoded;
    next();
  });
};

module.exports = verificarToken;