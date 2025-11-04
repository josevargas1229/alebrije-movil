import axiosClient, { setAuthHeader } from "@/api/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function createVenta(payload: {
  usuario_id: number | null;
  total: number;
  productos: Array<{
    producto_id: number;
    talla_id: number;
    color_id: number;
    cantidad: number;
    precio_unitario?: number;
  }>;
  recogerEnTienda: boolean;
  direccion_id: number | null;
}) {
  // Garantiza Authorization en el cliente global
  if (!axiosClient.defaults.headers.common.Authorization) {
    const t = await AsyncStorage.getItem("auth_token");
    if (t) setAuthHeader(t);
  }

  // Log de diagnóstico: URL efectiva
  console.log("POST", `${axiosClient.defaults.baseURL}/ventas`);
  console.log("Auth header:", axiosClient.defaults.headers.common.Authorization);

  const res = await axiosClient.post("/ventas/crear", payload, {
    withCredentials: true,
  });

  return res.data as { message: string; venta: { id: number } };
}
