import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";

// Deriva AppDispatch del store real
export type AppDispatch = typeof import("@/store").store.dispatch;

// useDispatch: castea el resultado (evita TS2347)
export const useAppDispatch = () => useDispatch() as AppDispatch;

// useSelector: tipa el state a RootState sin TypedUseSelectorHook
export const useAppSelector = useSelector as unknown as <
  TSelected
>(selector: (state: RootState) => TSelected, equalityFn?: (a: TSelected, b: TSelected) => boolean) => TSelected;
