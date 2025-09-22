import axiosClient, { setAuthHeader } from "./axiosClient";
import axios from "axios";

export interface LoginCredentials {
  email: string;
  password: string;
}

export type LoginResponse =
  | { token?: string; user?: any; message?: string }
  | any;

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
    setAuthHeader(null);

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

    return res.data;
  },

  checkAuth: async (): Promise<LoginResponse> => {
    const res = await axiosClient.get("/auth/check-auth");
    return res.data;
  },

  logout: async (): Promise<LoginResponse> => {
    const res = await axiosClient.post("/auth/logout");
    return res.data;
  },
};
