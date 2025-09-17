// Recurso de axios para generar los servicios
import axios from "axios";

const axiosClient = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para respuestas
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Manejo centralizado de errores
            if (error.response.status === 401) {
                console.warn("No autenticado. Redirigiendo al login...");
                // Aquí limpiar el estado global (Redux) y navegar a Login
            }
            if (error.response.status === 403) {
                console.warn("No autorizado para esta acción.");
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
