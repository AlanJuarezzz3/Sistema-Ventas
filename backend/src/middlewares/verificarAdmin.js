/**
 * verificarAdmin.js — Middleware de autorización por rol
 *
 * Verifica que el usuario autenticado tenga el rol de "admin".
 * Este middleware siempre se usa DESPUÉS de verificarToken,
 * ya que depende de que req.usuario esté disponible.
 *
 * Se aplica a rutas sensibles como:
 * - Eliminar o editar productos
 * - Eliminar clientes
 * - Anular o eliminar ventas
 * - Gestión de usuarios
 * - Dashboard
 *
 * Si el usuario es vendedor e intenta acceder a una ruta protegida,
 * recibe un 403 Forbidden.
 */

const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores." });
  }
  next();
};

module.exports = verificarAdmin;