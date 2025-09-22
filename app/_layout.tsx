import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "@/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { checkAuth } from "@/store/slices/authSlice";
import { useEffect } from "react";



function AppNavigator() {
  const colorScheme = useColorScheme();
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.auth);

  // Inicializar autenticación al cargar la aplicación
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        {user ? (
          <Stack.Screen
            name="(tabs)"
            options={{
              animation: "slide_from_right",
            }}
          />
        ) : (
          <Stack.Screen
            name="login"
            options={{
              animation: "fade",
            }}
          />
        )}
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen
          name="not-found"
          options={{
            title: "Página no encontrada",
            animation: "fade_from_bottom",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}
