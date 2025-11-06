import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, StatusBar } from "react-native";
import { useAppDispatch, useAppSelector } from "@/hooks/use-app-dispatch";
import { checkAuth, logoutThunk } from "@/store/slices/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, loading, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized) {
      dispatch(checkAuth() as any);
    }
  }, [dispatch, isInitialized]);

  const handleLogout = async () => {
    await dispatch(logoutThunk() as any);
    await AsyncStorage.removeItem("auth_token");
    dispatch({ type: "auth/logout" });
    router.replace("/login");
  };

  if (loading && !isInitialized) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const nombre =
    user?.nombreUsuario ||
    (user as any)?.nombre ||
    (user as any)?.username ||
    "Usuario";

  const inicial = nombre.slice(0, 1).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.content}>
        {/* Header - Avatar y Nombre */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#3B82F6", "#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{inicial}</Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.userName}>{nombre}</Text>
        </View>

        {/* Botón Cerrar Sesión - Centrado */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#EF4444", "#DC2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoutGradient}
            >
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 32,
  },
  avatarWrapper: {
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#3B82F6",
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.3,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#EF4444",
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  logoutGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});