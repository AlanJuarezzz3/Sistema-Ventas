export const getUsuario = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
};

export const isAdmin = () => {
  const usuario = getUsuario();
  return usuario?.rol === "admin";
};