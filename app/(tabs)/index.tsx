import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import type { RootState } from "@/store";
import { userService, UserInfo } from "@/api/userService";

const { width } = Dimensions.get("window");

const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, isInitialized } = useSelector((s: RootState) => s.auth);

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (isInitialized && user) {
      setProfileLoading(true);
      userService
        .getUserInfo()
        .then((data) => {
          console.log("UserInfo en Home:", data);
          setUserInfo(data);
        })
        .catch((err) => {
          console.log("Error al obtener userInfo en Home:", err);
        })
        .finally(() => setProfileLoading(false));
    }
  }, [isInitialized, user]);

  const nombre =
    (userInfo &&
      `${userInfo.nombre}`.trim()) ||
    (user?.nombreUsuario && String(user.nombreUsuario).trim()) ||
    "Empleado";

  const inicial = nombre.slice(0, 1).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header con gradiente */}
      <LinearGradient
        colors={["#1E293B", "#334155"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>{saludo()}</Text>
              <Text style={styles.userName}>{nombre}</Text>
            </View>
            
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#3B82F6", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{inicial}</Text>
              </LinearGradient>
              {profileLoading && (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          
          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.cardWrapper}
              activeOpacity={0.9}
              onPress={() => router.push("/(tabs)/(scanner)/scanner")}
            >
              <LinearGradient
                colors={["#3B82F6", "#2563EB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Scanner</Text>
                  <Text style={styles.cardSubtitle}>Escanear códigos QR</Text>
                </View>
                <View style={styles.cardArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardWrapper}
              activeOpacity={0.9}
              onPress={() => router.push("/(tabs)/(history)")}
            >
              <LinearGradient
                colors={["#8B5CF6", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Historial</Text>
                  <Text style={styles.cardSubtitle}>Ver registros de ventas</Text>
                </View>
                <View style={styles.cardArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
    }),
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  loadingIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  cardsGrid: {
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    minHeight: 100,
  },

  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 0.2,
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  infoCard: {
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
  infoHeader: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: 0.3,
  },
  infoContent: {
    gap: 0,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#D1FAE5",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
    letterSpacing: 0.5,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  bottomSpacer: {
    height: 24,
  },
});