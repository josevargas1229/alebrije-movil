import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "draft_sale_order_v1";

export type DraftStatus = "en_proceso" | "finalizada" | "cancelada";

export interface DraftCustomer {
  nombre?: string;
  telefono?: string;
  email?: string;
}

export interface DraftSale {
  id: string;              // uuid corto o similar
  orderNumber: string;     // ORD-YYYYMMDD-HHMMSS-XXXX
  createdAt: string;       // ISO timestamp
  status: DraftStatus;     // en_proceso
  customer: DraftCustomer; // opcional
  items: any[];            // por ahora vacío
}

interface SalesState {
  draft: DraftSale | null;
  loading: boolean;
  error: string | null;
}

const initialState: SalesState = {
  draft: null,
  loading: false,
  error: null,
};

// Utils
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

// Thunks de persistencia
export const loadDraftFromStorage = createAsyncThunk("sales/loadDraft", async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as DraftSale) : null;
});

export const persistDraftToStorage = createAsyncThunk(
  "sales/persistDraft",
  async (_, { getState }) => {
    const state = getState() as any;
    const draft: DraftSale | null = state.sales.draft;
    if (draft) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
    return draft;
  }
);

export const clearDraftFromStorage = createAsyncThunk("sales/clearDraft", async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return true;
});

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    startNewOrder(state) {
      state.draft = {
        id: genId(),
        orderNumber: genOrderNumber(),
        createdAt: new Date().toISOString(),
        status: "en_proceso",
        customer: {},
        items: [],
      };
      state.error = null;
    },
    updateCustomer(
      state,
      action: PayloadAction<Partial<DraftCustomer>>
    ) {
      if (!state.draft) return;
      state.draft.customer = { ...state.draft.customer, ...action.payload };
    },
    setStatus(state, action: PayloadAction<DraftStatus>) {
      if (!state.draft) return;
      state.draft.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDraftFromStorage.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadDraftFromStorage.fulfilled, (s, a) => { s.loading = false; s.draft = a.payload; })
      .addCase(loadDraftFromStorage.rejected, (s, a) => { s.loading = false; s.error = String(a.error.message || "Error al cargar borrador"); })
      .addCase(persistDraftToStorage.rejected, (s, a) => { s.error = String(a.error.message || "Error al guardar borrador"); })
      .addCase(clearDraftFromStorage.fulfilled, (s) => { s.draft = null; });
  },
});

export const { startNewOrder, updateCustomer, setStatus } = salesSlice.actions;
export default salesSlice.reducer;
