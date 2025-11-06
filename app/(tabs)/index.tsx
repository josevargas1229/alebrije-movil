import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import type { RootState } from "@/store";

const { width } = Dimensions.get("window");

const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

const getGreetingIcon = () => {
  const h = new Date().getHours();
  if (h < 12) return;
  if (h < 19) return;
  return ;

};

export default function HomeScreen() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const nombre = (user?.nombreUsuario && String(user.nombreUsuario).trim()) || "Empleado";
  const inicial = nombre.slice(0, 1).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header con diseño moderno */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#3B82F6", "#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{inicial}</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.greetingContainer}>
            <View style={styles.greetingRow}>
              <Text style={styles.hello}>{saludo()}</Text>
            </View>
            <Text style={styles.welcome}>{nombre}</Text>
          </View>
        </View>
      </View>

      {/* Cards Grid */}
      <View style={styles.cardsContainer}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.cardWrapper}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/(scanner)/scanner")}
          >
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardContent}> 
                <Text style={styles.cardTitle}>Scanner</Text>
                <Text style={styles.cardSubtitle}>Escanear códigos QR</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardWrapper}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/(history)")}
          >
            <LinearGradient
              colors={["#8B5CF6", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Historial</Text>
                <Text style={styles.cardSubtitle}>Ver registros</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
              </View>
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
  headerContainer: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#3B82F6",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
    }),
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  greetingContainer: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  greetingIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  hello: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  welcome: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "900",
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  grid: {
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 20,
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    minHeight: 120,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardContent: {
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});