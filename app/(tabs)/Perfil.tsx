import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, StatusBar, ScrollView } from "react-native";
import { useAppDispatch, useAppSelector } from "@/hooks/use-app-dispatch";
import { checkAuth, logoutThunk } from "@/store/slices/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { userService, UserInfo } from "@/api/userService";

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, loading, isInitialized } = useAppSelector((state) => state.auth);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      dispatch(checkAuth() as any);
    }
  }, [dispatch, isInitialized]);

  useEffect(() => {
    if (isInitialized && user) {
      setProfileLoading(true);
      userService
        .getUserInfo()
        .then((data) => {
          console.log("UserInfo desde backend:", data);
          setUserInfo(data);
        })
        .catch((err) => {
          console.log("Error al obtener userInfo:", err);
        })
        .finally(() => setProfileLoading(false));
    }
  }, [isInitialized, user]);

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
    (userInfo &&
      `${userInfo.nombre}`.trim()) ||
    user?.nombreUsuario ||
    (user as any)?.nombre ||
    (user as any)?.username ||
    "Usuario";

  const email =
    userInfo?.email ||
    (user as any)?.email ||
    (user as any)?.correo ||
    "Sin correo registrado";

  const inicial = nombre.slice(0, 1).toUpperCase();
  const statusText = user ? "Activo" : "Sin sesión";
  const isActive = !!user;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      
      {/* Header con gradiente */}
      <LinearGradient
        colors={["#1E293B", "#334155"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#3B82F6", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{inicial}</Text>
            </LinearGradient>
            
            {/* Badge de estado */}
            <View style={[styles.statusBadge, isActive && styles.statusBadgeActive]}>
              <View style={styles.statusDotSmall} />
            </View>
          </View>
          
          <Text style={styles.userName}>{nombre}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de información */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de la cuenta</Text>
          
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nombre de usuario</Text>
                <Text style={styles.infoValue}>{nombre}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Correo electrónico</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Estado de sesión</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotInactive]} />
                  <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                    {statusText}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>



        {/* Botón de cerrar sesión */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#EF4444", "#DC2626"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutGradient}
          >
            <View style={styles.logoutContent}>
              <Text style={styles.logoutIcon}>⎋</Text>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 8 },
    }),
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 10 },
    }),
  },
  avatarText: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  statusBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#94A3B8",
    borderWidth: 4,
    borderColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeActive: {
    backgroundColor: "#22C55E",
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  infoSection: {
    gap: 0,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: "#22C55E",
  },
  statusDotInactive: {
    backgroundColor: "#94A3B8",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusTextActive: {
    color: "#166534",
  },
  statusTextInactive: {
    color: "#64748B",
  },

  logoutButton: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#EF4444",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  logoutGradient: {
    paddingVertical: 18,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    marginRight: 8,
    fontWeight: "700",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 24,
  },
});