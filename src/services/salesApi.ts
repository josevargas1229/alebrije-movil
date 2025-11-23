import axiosClient, { setAuthHeader } from "@/api/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";


export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "desconocido";

export interface VentaDetalleResumen {
  id: number;
  fecha_venta?: string;          
  created_at?: string;           
  total: number;
  estado: "Pendiente" | "Completada" | "Cancelada" | string;
  metodo_pago?: MetodoPago;      
  orderNumber?: string;          
   numeroOrden?: string;     
  numero_orden?: string;   
}

export interface VentasUsuarioResp {
  ventas: VentaDetalleResumen[];
}


export interface VentaDetalleItem {
  id: number;
  cantidad: number;
  subtotal: number;
  producto?: {
    id?: number;
    precio?: number;
    tipoProducto?: { nombre?: string };
    imagenes?: Array<{ imagen_url: string }>;
  };
  talla?: { talla?: string };
  color?: { color?: string; colorHex?: string };
}

export interface VentaDetalleFull {
  id: number;
  total: number;
  estado: string;
  orderNumber?: string;
  fecha_venta?: string;
  created_at?: string;
  detalles: VentaDetalleItem[];
}


export async function getVentaById(ventaId: number): Promise<VentaDetalleFull> {

  if (!axiosClient.defaults.headers.common.Authorization) {
    const t = await AsyncStorage.getItem("auth_token");
    if (t) setAuthHeader(t);
  }

  const res = await axiosClient.get<{ venta: VentaDetalleFull }>(
    `/ventas/${ventaId}`,
    { withCredentials: true }
  );

  return res.data.venta;
}


export async function getVentasByUsuario(usuarioId: number) {
  const res = await axiosClient.get<VentasUsuarioResp>(`/ventas/usuario/${usuarioId}`, {
    withCredentials: true,
  });
  return res.data.ventas ?? [];
}

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
  metodo_pago?: "efectivo" | "tarjeta" | "transferencia";
}) {

  if (!axiosClient.defaults.headers.common.Authorization) {
    const t = await AsyncStorage.getItem("auth_token");
    if (t) setAuthHeader(t);
  }


  console.log("POST", `${axiosClient.defaults.baseURL}/ventas`);
  console.log("Auth header:", axiosClient.defaults.headers.common.Authorization);

  const res = await axiosClient.post("/ventas/crear", payload, {
    withCredentials: true,
  });

  return res.data as { message: string; venta: { id: number } };
}
