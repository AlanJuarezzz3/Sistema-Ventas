/**
 * Obtiene la información del usuario a partir del token JWT almacenado en localStorage
 * Decodifica manualmente el payload del token
 */
export const getUsuario = () => {
  // Obtiene el token guardado en el navegador
  const token = localStorage.getItem("token");

  // Si no hay token, no hay usuario autenticado
  if (!token) return null;

  try {
    // El JWT tiene formato: header.payload.signature
    // Se obtiene la parte del payload (segunda parte)
    const payload = token.split(".")[1];

    // Decodifica el payload (Base64 → JSON)
    const decoded = JSON.parse(atob(payload));

    // Devuelve la información del usuario contenida en el token
    return decoded;
  } catch {
    // Si ocurre algún error (token inválido, mal formado, etc.)
    return null;
  }
};

/**
 * Verifica si el usuario autenticado tiene rol de administrador
 */
export const isAdmin = () => {
  // Obtiene el usuario desde el token
  const usuario = getUsuario();

  // Retorna true si el rol es "admin", false en caso contrario
  return usuario?.rol === "admin";
};