import { Stack } from "expo-router";

export default function SalesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Ventas" }} />
      <Stack.Screen name="[id]" options={{ headerShown: false, title: "Detalle de Venta" }} />
    </Stack>
  );
}