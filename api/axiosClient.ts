// @/api/axiosClient.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 1) Normaliza: quita /api si viene en la env
const RAW = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
const ROOT = RAW.replace(/\/api\/?$/i, "").replace(/\/+$/,""); // <- SIN /api
const axiosClient = axios.create({
  baseURL: ROOT,                    // <- base en raíz, no /api
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let currentToken: string | null = null;
export const setAuthHeader = (token?: string | null) => {
  currentToken = token ?? null;
  if (token) axiosClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete axiosClient.defaults.headers.common.Authorization;
};

export const initAuthHeader = async () => {
  const t = await AsyncStorage.getItem("auth_token");
  if (t) setAuthHeader(t);
};

axiosClient.interceptors.request.use((config) => {
  (config.headers as any)["X-Client-Platform"] = "mobile";
  const url = (config.url || "").toLowerCase();

  // No envíes Authorization a login/logout
  if (url.includes("/auth/login") || url.includes("/auth/logout")) {
    if (config.headers) delete (config.headers as any).Authorization;
  }

  // Traza útil para /ventas
  if (url.includes("/ventas")) {
    const auth = (config.headers as any)?.Authorization || axiosClient.defaults.headers.common.Authorization;
    console.log("Authorization en /ventas =>", auth);
    console.log("URL efectiva /ventas =>", `${axiosClient.defaults.baseURL}${config.url?.startsWith("/") ? "" : "/"}${config.url}`);
  }
  return config;
});

axiosClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response) {
      const { status, config, data } = error.response;
      console.warn(`[HTTP ${status}] ${config.method?.toUpperCase()} ${config.url}`);
      console.warn("Respuesta backend:", typeof data === "string" ? data : JSON.stringify(data));
      if (status === 401) console.warn("No autenticado.");
      if (status === 403) console.warn("No autorizado.");
    } else {
      console.warn("Error de red/timeout:", error?.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
