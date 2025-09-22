// Recurso de axios para generar los servicios
import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthHeader = (token?: string | null) => {
  if (token) {
    axiosClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosClient.defaults.headers.common.Authorization;
  }
};

axiosClient.interceptors.request.use((config) => {
  (config.headers as any)["X-Client-Platform"] = "mobile";

  const url = (config.url || "").toLowerCase();
  if (url.includes("/auth/login") || url.includes("/auth/logout")) {
    if (config.headers) delete (config.headers as any).Authorization;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, config, data } = error.response;
      console.warn(`[HTTP ${status}] ${config.method?.toUpperCase()} ${config.url}`);
      console.warn(
        "Respuesta backend:",
        typeof data === "string" ? data : JSON.stringify(data)
      );

      if (status === 401) {
        console.warn("No autenticado. Redirigiendo al login...");
      }
      if (status === 403) {
        console.warn("No autorizado para esta acción.");
      }
    } else {
      console.warn("Error de red/timeout:", error?.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
