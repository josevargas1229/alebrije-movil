//2. Crear slice
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService, LoginCredentials } from "../../api/authService";

// Define the shape of the auth state
interface AuthState {
    user: null | any;
    token: null | string;
    loading: boolean;
    error: null | string; 
}

// Async thunk for login
export const login = createAsyncThunk(
    "auth/login",
    async (credentials: LoginCredentials, thunkAPI) => {
        try {
            const response = await authService.login(credentials);
            return response; 
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data || "Error en login");
        }
    }
);

// Create the auth slice
const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        token: null,
        loading: false,
        error: null,
    } as AuthState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

// Export actions and reducer
export const { logout } = authSlice.actions;
export default authSlice.reducer;