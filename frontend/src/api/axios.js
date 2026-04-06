// Importa la librería axios para hacer peticiones HTTP
import axios from "axios";

// Crea una instancia personalizada de axios
const api = axios.create({
  // URL base para todas las requests (backend)
  baseURL: "http://localhost:3000",
});

/**
 * Interceptor de requests
 * Se ejecuta antes de cada petición HTTP
 */
api.interceptors.request.use((config) => {
  // Obtiene el token almacenado en localStorage
  const token = localStorage.getItem("token");

  // Si existe el token, lo agrega en el header Authorization
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Devuelve la configuración modificada para continuar con la request
  return config;
});

// Exporta la instancia configurada para usarla en toda la app
export default api;