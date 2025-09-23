import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService, LoginCredentials } from "@/api/authService";

interface User {
  nombreUsuario?: string;
  tipo: number;
  userId: number;
  verified?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  hasCheckedAuth: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  hasCheckedAuth: false,
  isInitialized: false,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, thunkAPI) => {
    try {
      const response = await authService.login(credentials);
      return {
        user: response.user,
      };
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

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, thunkAPI) => {
    try {
      const response = await authService.checkAuth();
      return {
        user: response.user,
      };
    } catch (err: any) {
      console.log("CheckAuth failed:", err.message || err);
      return thunkAPI.rejectWithValue(null);
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logoutThunk",
  async (_, thunkAPI) => {
    try {
      await authService.logout();
      return null;
    } catch (err: any) {
      // Aún si falla el logout en el servidor, limpiamos el estado local
      console.warn("Logout API failed, but clearing local state:", err);
      return null;
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
        if (!state.hasCheckedAuth) {
          state.hasCheckedAuth = true;
          state.isInitialized = true;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Credenciales inválidas";
        state.user = null;
      })

      // CHECK AUTH
      .addCase(checkAuth.pending, (state) => {
        if (!state.isInitialized) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        console.log("checkAuth fulfilled, updating state with user:", action.payload.user);
        state.loading = false;
        state.user = action.payload.user;
        state.hasCheckedAuth = true;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        console.log("checkAuth rejected, setting state to initialized");
        state.loading = false;
        state.user = null;
        state.hasCheckedAuth = true;
        state.isInitialized = true;
      })

      // LOGOUT
      .addCase(logoutThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.error = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
