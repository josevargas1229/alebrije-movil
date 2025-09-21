// app/index.tsx
import React from "react";
import { Redirect } from "expo-router";
import { useSelector } from "react-redux";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, loading } = useSelector((s: any) => s.auth);

  // Opcional: pantalla de carga mientras checkAuth corre
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Si hay sesión -> tabs, si no -> login
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
