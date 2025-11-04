import axiosClient from "./axiosClient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthHeader } from "./axiosClient";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  nombreUsuario?: string;
  tipo: number;
  userId: number;
  verified?: boolean;
}

export interface LoginResponse {
  user: User | null;
  message?: string;
  token?: string;
}

export const authService = {
  getCsrf: async () => {
    const root = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
    const res = await axios.get(`${root}/csrf-token`, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "mobile",
      },
    });
    const token = res.data?.csrfToken;
if (token) {
  axiosClient.defaults.headers.common["X-CSRF-Token"] = token;
  await AsyncStorage.setItem("csrf_token", token).catch(() => {});
}
    return res.data?.csrfToken;
    
  },

  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const csrfToken = await authService.getCsrf();
    const body = {
      credenciales: {
        email: credentials.email,
        contraseña: credentials.password,
      },
      captchaToken: "dev-placeholder",
    };

    const root = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
    const url = `${root}/auth/login`;

    const res = await axios.post(url, body, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "mobile",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
    });

    const data = res.data;
    const headerAuth = res.headers?.authorization as string | undefined;
const headerToken = headerAuth?.startsWith("Bearer ")
  ? headerAuth.slice(7)
  : undefined;
const token =
  data?.token || data?.accessToken || data?.jwt || headerToken || null;
  if (token) {
  setAuthHeader(token);            
  try { await AsyncStorage.setItem("auth_token", token); } catch {}
}
    return {
      user: data.user
        ? {
            nombreUsuario: data.user.nombreUsuario,
            tipo: data.user.tipo,
            userId: data.user.userId,
            verified: data.user.verified,
          }
        : (data.tipo && data.userId
            ? {
                nombreUsuario: data.nombreUsuario,
                tipo: data.tipo,
                userId: data.userId,
                verified: data.verified,
              }
            : null),
      message: data.message,
      token,
    };
  },

  checkAuth: async (): Promise<LoginResponse> => {
    const res = await axiosClient.get("/auth/check-auth", {
      withCredentials: true,
    });
    const data = res.data;
    const headerAuth = res.headers?.authorization as string | undefined;
const headerToken = headerAuth?.startsWith("Bearer ")
  ? headerAuth.slice(7)
  : undefined;
const token =
  data?.token || data?.accessToken || data?.jwt || headerToken || null;
  if (!token) {
  console.warn("Login OK pero sin token. Respuesta:", JSON.stringify(data));
  throw new Error("El backend no devolvió token de sesión.");
}
    return {
      user: data.user
        ? {
            nombreUsuario: data.user.nombreUsuario,
            tipo: data.user.tipo,
            userId: data.user.userId,
            verified: data.user.verified,
          }
        : (data.tipo && data.userId
            ? {
                nombreUsuario: data.nombreUsuario,
                tipo: data.tipo,
                userId: data.userId,
                verified: data.verified,
              }
            : null),
      token,
    };
  },

  logout: async (): Promise<LoginResponse> => {
    const res = await axiosClient.post("/auth/logout", {}, {
      withCredentials: true,
    });
    return {
      user: null,
      message: res.data.message,
    };
  },
};
