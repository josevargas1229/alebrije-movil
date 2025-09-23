import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";

// Para usar dispatch con thunks tipados
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Para que useSelector ya tenga el tipo RootState
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
