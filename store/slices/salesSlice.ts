import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface VentaProducto {
  producto_id: number;
  talla_id: number;
  color_id: number;
  cantidad: number;
  precio_unitario?: number;
}

export type DraftStatus = "en_proceso" | "finalizada" | "cancelada";
export const DRAFT_STATUS_LABELS: Record<DraftStatus, string> = {
  en_proceso: "En proceso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

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
  drafts: { [id: string]: DraftSale };
  activeSaleId: string | null;
}

const MAX_SALES = 3;

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
  drafts: {},
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
      if (Object.keys(state.drafts).length >= MAX_SALES) {
        return;
      }
      const id = genId();
      state.drafts[id] = {
        id,
        orderNumber: genOrderNumber(),
        createdAt: new Date().toISOString(),
        usuario_id: action.payload?.usuario_id ?? null,
        total: 0,
        productos: [],
        recogerEnTienda: false,
        direccion_id: null,
        status: "en_proceso",
      };
      state.activeSaleId = id;
    },

    setUsuario(state, action: PayloadAction<{ id: string; usuario_id: number | null }>) {
      const { id, usuario_id } = action.payload;
      if (!state.drafts[id]) return;
      state.drafts[id].usuario_id = usuario_id;
    },

    setRecogerEnTienda(state, action: PayloadAction<{ id: string; value: boolean }>) {
      const { id, value } = action.payload;
      if (!state.drafts[id]) return;
      state.drafts[id].recogerEnTienda = value;
    },

    setDireccion(state, action: PayloadAction<{ id: string; direccion_id: number | null }>) {
      const { id, direccion_id } = action.payload;
      if (!state.drafts[id]) return;
      state.drafts[id].direccion_id = direccion_id;
    },

    addProducto(state, action: PayloadAction<{ id: string; producto: VentaProducto }>) {
      const { id, producto } = action.payload;
      if (!state.drafts[id]) return;
      state.drafts[id].productos.push(producto);
      state.drafts[id].total = recalcTotal(state.drafts[id].productos);
    },

    setActiveSale(state, action: PayloadAction<string | null>) {
      state.activeSaleId = action.payload;
    },

    updateProducto(
      state,
      action: PayloadAction<{ id: string; index: number; patch: Partial<VentaProducto> }>
    ) {
      const { id, index, patch } = action.payload;
      if (!state.drafts[id]) return;
      const curr = state.drafts[id].productos[index];
      if (!curr) return;
      state.drafts[id].productos[index] = { ...curr, ...patch };
      state.drafts[id].total = recalcTotal(state.drafts[id].productos);
    },

    removeProducto(state, action: PayloadAction<{ id: string; index: number }>) {
      const { id, index } = action.payload;
      if (!state.drafts[id]) return;
      state.drafts[id].productos.splice(index, 1);
      state.drafts[id].total = recalcTotal(state.drafts[id].productos);
    },

    clearProductos(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (!state.drafts[id]) return;
      state.drafts[id].productos = [];
      state.drafts[id].total = 0;
    },

    setStatus(state, action: PayloadAction<{ id: string; status: DraftStatus }>) {
      const { id, status } = action.payload;
      if (!state.drafts[id]) return;
      state.drafts[id].status = status;
    },

    clearDraft(state, action: PayloadAction<string>) {
      const id = action.payload;
      delete state.drafts[id];
      if (state.activeSaleId === id) state.activeSaleId = null;
    },

    clearAllDrafts(state) {
      state.drafts = {};
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
  clearAllDrafts,
  setActiveSale,
} = salesSlice.actions;

export default salesSlice.reducer;