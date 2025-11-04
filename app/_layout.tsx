import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Provider } from "react-redux";
import { store } from "@/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { initAuthHeader } from "@/api/axiosClient";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try { await initAuthHeader(); } finally { setReady(true); }
    })();
  }, []);

  if (!ready) return null; // <- no renderiza nada hasta setear Authorization

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false, animation: "fade" }} initialRouteName="loading">
            <Stack.Screen name="loading" options={{ animation: "fade" }} />
            <Stack.Screen name="login" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
            <Stack.Screen name="not-found" options={{ title: "Página no encontrada", animation: "fade_from_bottom" }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
