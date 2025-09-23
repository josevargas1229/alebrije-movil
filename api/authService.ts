import axiosClient from "./axiosClient";
import axios from "axios";

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
    };
  },

  checkAuth: async (): Promise<LoginResponse> => {
    const res = await axiosClient.get("/auth/check-auth", {
      withCredentials: true,
    });
    const data = res.data;

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
