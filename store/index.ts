import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import salesReducer from "./slices/salesSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        product: productReducer,
        sales: salesReducer
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
