// 1. Crear servicio
import axiosClient from "./axiosClient";

export interface LoginCredentials {
    email: string;
    password: string;
}

export const authService = {
    login: async (credentials: LoginCredentials) => {
        const res = await axiosClient.post("/auth/login", { credenciales: credentials });
        return res.data;
    },

    checkAuth: async () => {
        const res = await axiosClient.get("/auth/check-auth");
        return res.data;
    },

    logout: async () => {
        const res = await axiosClient.post("/auth/logout");
        return res.data;
    },
};
