// store/slices/authSlice.ts
// 2. Crear slice
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService, LoginCredentials } from "../../api/authService";
import { setAuthHeader } from "../../api/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the shape of the auth state
interface AuthState {
  user: null | any;
  token: null | string;
  loading: boolean;
  error: null | string;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

// Async thunk for login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, thunkAPI) => {
    console.log("Credenciales enviadas:", credentials);
    try {
      const response = await authService.login(credentials);
      return response; // se espera { token?, user?, message? }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Error en login";
      return thunkAPI.rejectWithValue(
        typeof msg === "string" ? msg : "Error en login"
      );
    }
  }
);

// Verifica sesión activa y restaura token (JWT) si existe
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, thunkAPI) => {
    try {
      // 1) Intenta restaurar token persistido (si usas JWT)
      const token = await AsyncStorage.getItem("auth_token");
      if (token) setAuthHeader(token);

      // 2) Pregunta al backend si la sesión es válida (JWT o cookie)
      const response = await authService.checkAuth(); // se espera { user, token? }
      return { ...response, token: response?.token ?? token ?? null };
    } catch (_err: any) {
      return thunkAPI.rejectWithValue(null);
    }
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      setAuthHeader(null);
      AsyncStorage.removeItem("auth_token").catch(() => {});
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: any) => {
        state.loading = false;
        state.token = action.payload?.token ?? null;
        state.user = action.payload?.user ?? null;

        if (state.token) {
          setAuthHeader(state.token);
          AsyncStorage.setItem("auth_token", state.token).catch(() => {});
        } else {
          // Si trabajas solo con cookies HttpOnly
          setAuthHeader(null);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Credenciales inválidas";
      })
      // CHECK AUTH
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: any) => {
        state.loading = false;
        state.user = action.payload?.user ?? null;
        state.token = action.payload?.token ?? null;
        if (state.token) setAuthHeader(state.token);
        else setAuthHeader(null);
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        setAuthHeader(null);
      });
  },
});

// Export actions and reducer
export const { logout } = authSlice.actions;
export default authSlice.reducer;
