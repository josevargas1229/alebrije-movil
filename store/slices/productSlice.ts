import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { productService, Product, ProductResponse } from "@/api/productService";

interface ProductState {
    product: Product | null;
    loading: boolean;
    error: string | null;
}

const initialState: ProductState = {
    product: null,
    loading: false,
    error: null,
};

export const fetchProductByQR = createAsyncThunk(
    "product/fetchProductByQR",
    async (idProducto: string, thunkAPI) => {
        try {
            const response = await productService.getProductByQR(idProducto);
            return response;
        } catch (err: any) {
            const msg = err?.message || "Error al obtener el producto";
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

const productSlice = createSlice({
    name: "product",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearProduct: (state) => {
            state.product = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProductByQR.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductByQR.fulfilled, (state, action) => {
                state.loading = false;
                state.product = action.payload.product;
                state.error = action.payload.message || null;
            })
            .addCase(fetchProductByQR.rejected, (state, action) => {
                state.loading = false;
                state.product = null;
                state.error = (action.payload as string) || "Error al obtener el producto";
            });
    },
});

export const { clearError, clearProduct } = productSlice.actions;
export default productSlice.reducer;