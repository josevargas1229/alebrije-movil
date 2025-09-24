import axiosClient from "./axiosClient";

export interface Talla {
    id: number;
    talla: string;
}

export interface Color {
    id: number;
    color: string;
    colorHex: string;
    imagenes: { id: number; url: string }[];
}

export interface TallaColorStock {
    id: number;
    producto_id: number;
    stock: number;
    talla: Talla;
    coloresStock: Color;
}

export interface Product {
    id: number;
    temporada: {
        id: number;
        temporada: string;
    };
    categoria: {
        id: number;
        nombre: string;
    };
    tipo: {
        id: number;
        nombre: string;
    };
    marca: {
        id: number;
        nombre: string;
    };
    precio: string;
    estado: boolean;
    calificacion: string;
    created_at: string;
    updated_at: string;
    tallasColoresStock: TallaColorStock[];
    calificacionPromedio: number;
    totalCalificaciones: number;
    promocion: any | null;
}

export interface ProductResponse {
    product: Product | null;
    message?: string;
}

export const productService = {
    getProductByQR: async (qrCode: string): Promise<ProductResponse> => {
        try {
            const res = await axiosClient.get(`/producto/${qrCode}`, {
                withCredentials: true,
            });
            const data = res.data;

            return {
                product: data.producto
                    ? {
                        id: data.producto.id,
                        temporada: {
                            id: data.producto.temporada.id,
                            temporada: data.producto.temporada.temporada,
                        },
                        categoria: {
                            id: data.producto.categoria.id,
                            nombre: data.producto.categoria.nombre,
                        },
                        tipo: {
                            id: data.producto.tipo.id,
                            nombre: data.producto.tipo.nombre,
                        },
                        marca: {
                            id: data.producto.marca.id,
                            nombre: data.producto.marca.nombre,
                        },
                        precio: data.producto.precio,
                        estado: data.producto.estado,
                        calificacion: data.producto.calificacion,
                        created_at: data.producto.created_at,
                        updated_at: data.producto.updated_at,
                        tallasColoresStock: data.producto.tallasColoresStock,
                        calificacionPromedio: data.producto.calificacionPromedio,
                        totalCalificaciones: data.producto.totalCalificaciones,
                        promocion: data.producto.promocion,
                    }
                    : null,
                message: data.message,
            };
        } catch (error: any) {
            throw new Error(
                error?.response?.data?.message || "Error al consultar el producto"
            );
        }
    },
};