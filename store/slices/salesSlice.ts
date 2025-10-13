import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface VentaProducto {
  producto_id: number;
  talla_id: number;
  color_id: number;
  cantidad: number;
  precio_unitario?: number;
}

export type DraftStatus = "en_proceso" | "finalizada" | "cancelada";

export interface DraftSale {
  id: string;
  orderNumber: string;
  createdAt: string;
  usuario_id: number | null;
  total: number;
  productos: VentaProducto[];
  recogerEnTienda: boolean;
  direccion_id: number | null;
  status: DraftStatus;
}

interface SalesState {
  draft: DraftSale | null;
  activeSaleId: string | null;
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const genOrderNumber = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${y}${m}${day}-${hh}${mm}${ss}-${rand}`;
};
const genId = () => Math.random().toString(36).slice(2, 10);

const recalcTotal = (productos: VentaProducto[]) =>
  productos.reduce((acc, p) => acc + (p.precio_unitario || 0) * p.cantidad, 0);

const initialState: SalesState = {
  draft: null,
  activeSaleId: null,
};

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    startNewOrder(
      state,
      action: PayloadAction<{ usuario_id?: number | null } | undefined>
    ) {
      state.draft = {
        id: genId(),
        orderNumber: genOrderNumber(),
        createdAt: new Date().toISOString(),
        usuario_id: action.payload?.usuario_id ?? null,
        total: 0,
        productos: [],
        recogerEnTienda: false,
        direccion_id: null,
        status: "en_proceso",
      };
      state.activeSaleId = state.draft.id; // activa la nueva venta
    },

    setUsuario(state, action: PayloadAction<number | null>) {
      if (!state.draft) return;
      state.draft.usuario_id = action.payload;
    },

    setRecogerEnTienda(state, action: PayloadAction<boolean>) {
      if (!state.draft) return;
      state.draft.recogerEnTienda = action.payload;
    },

    setDireccion(state, action: PayloadAction<number | null>) {
      if (!state.draft) return;
      state.draft.direccion_id = action.payload;
    },

    addProducto(state, action: PayloadAction<VentaProducto>) {
      if (!state.draft) return;
      state.draft.productos.push(action.payload);
      state.draft.total = recalcTotal(state.draft.productos);
    },

    setActiveSale(state, action: PayloadAction<string | null>) {
      state.activeSaleId = action.payload;
    },

    updateProducto(
      state,
      action: PayloadAction<{ index: number; patch: Partial<VentaProducto> }>
    ) {
      if (!state.draft) return;
      const { index, patch } = action.payload;
      const curr = state.draft.productos[index];
      if (!curr) return;
      state.draft.productos[index] = { ...curr, ...patch };
      state.draft.total = recalcTotal(state.draft.productos);
    },

    removeProducto(state, action: PayloadAction<number>) {
      if (!state.draft) return;
      state.draft.productos.splice(action.payload, 1);
      state.draft.total = recalcTotal(state.draft.productos);
    },

    clearProductos(state) {
      if (!state.draft) return;
      state.draft.productos = [];
      state.draft.total = 0;
    },

    setStatus(state, action: PayloadAction<DraftStatus>) {
      if (!state.draft) return;
      state.draft.status = action.payload;
    },

    clearDraft(state) {
      state.draft = null;
      state.activeSaleId = null;
    },
  },
});

export const {
  startNewOrder,
  setUsuario,
  setRecogerEnTienda,
  setDireccion,
  addProducto,
  updateProducto,
  removeProducto,
  clearProductos,
  setStatus,
  clearDraft,
  setActiveSale,
} = salesSlice.actions;

export default salesSlice.reducer;
