import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform, ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import type { RootState } from "@/store";
import { getVentasByUsuario, VentaDetalleResumen, MetodoPago } from "@/src/services/salesApi";
import { RefreshControl } from "react-native";

type FiltroMetodo = "todos" | MetodoPago;
const PAGE_SIZE = 20;

const num = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
};
const money = (v: unknown) => num(v).toFixed(2);
const dt = (v: unknown) => {
  const d = new Date(String(v ?? ""));
  return isNaN(d.getTime()) ? null : d;
};

const normalizeMetodo = (v: any): MetodoPago | "desconocido" => {
  const fromSuccessTx = Array.isArray(v?.transacciones)
    ? v.transacciones.find((t: any) => String(t?.estado).toLowerCase() === "exitoso")?.metodo_pago
    : undefined;

  const rawSrc =
    fromSuccessTx ??
    v?.metodo_pago ??
    v?.metodo ??
    v?.payment_method ??
    v?.metodoPago ??
    v?.transaccion?.metodo_pago ??
    v?.transacciones?.[0]?.metodo_pago ??
    "";

  const raw = String(rawSrc).trim().toLowerCase();
  if (!raw) return "desconocido";
  if (raw.startsWith("efec")) return "efectivo";
  if (raw.startsWith("tarj") || raw === "card") return "tarjeta";
  if (raw.startsWith("trans") || raw.includes("spei") || raw.includes("transfer")) return "transferencia";
  return "desconocido";
};

const normalizeEstado = (v: any) => {
  const eVenta = String(v?.estado ?? "").toLowerCase();
  const eTx = String(
    v?.transaccion?.estado ??
    v?.transacciones?.[0]?.estado ??
    ""
  ).toLowerCase();

  const ok =
    eVenta.startsWith("complet") ||
    ["exitoso","approved","completed","success","pagado","paid"].some(x => eTx.includes(x));

  const pending =
    eVenta.startsWith("pend") ||
    ["pend","in_process","pending"].some(x => eTx.includes(x));

  if (ok) return { text: "Exitoso", isOk: true };
  if (pending) return { text: "Pendiente", isOk: false };
  return { text: (v?.estado ?? "Pendiente").toString(), isOk: false };
};



export default function SalesHistoryScreen() {
  const router = useRouter();
  const usuarioId = useSelector((s: RootState) => s.auth.user?.userId ?? 0);

  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<VentaDetalleResumen[]>([]);
  const [cacheMetodo, setCacheMetodo] = useState<Record<number, MetodoPago | "desconocido">>({});

  const [q, setQ] = useState("");
  const [metodo, setMetodo] = useState<FiltroMetodo>("todos");
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const ventas = await getVentasByUsuario(usuarioId);
      const sorted = [...ventas].sort((a, b) => {
        const da = dt(a.fecha_venta ?? a.created_at);
        const db = dt(b.fecha_venta ?? b.created_at);
        return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
      });
      const map: Record<number, MetodoPago | "desconocido"> = {};
      for (const v of sorted) map[v.id] = normalizeMetodo(v);
      setCacheMetodo(map);
      setSource(sorted);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useFocusEffect(
  useCallback(() => {
    load();            
  }, [load])
);

  const filtered = useMemo(() => {
    const d0 = desde ? new Date(`${desde}T00:00:00`) : null;
    const d1 = hasta ? new Date(`${hasta}T23:59:59`) : null;

    return source.filter(v => {
      if (metodo !== "todos") {
        const m = cacheMetodo[v.id] ?? normalizeMetodo(v);
        if (m !== metodo) return false;
      }
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const order = (v.orderNumber ?? v.numeroOrden ?? `${v.id}`).toString().toLowerCase();
        if (!order.includes(needle)) return false;
      }
      const f = dt(v.fecha_venta ?? v.created_at);
      if (f && (d0 || d1)) {
        if (d0 && f < d0) return false;
        if (d1 && f > d1) return false;
      }
      return true;
    });
  }, [source, metodo, q, desde, hasta, cacheMetodo]);

  const pageItems = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);

  const onEnd = () => {
    if (page * PAGE_SIZE < filtered.length) setPage(p => p + 1);
  };

  const goDetail = (ventaId: number) => {
    router.push(`/(tabs)/(history)/${ventaId}`);
  };

  // Calcular totales
  const totalVentas = filtered.length;
  const totalMonto = filtered.reduce((sum, v) => sum + num(v.total), 0);

  const Item = ({ item, index }: { item: VentaDetalleResumen; index: number }) => {
    const when = dt(item.fecha_venta ?? item.created_at);
    const fechaFmt = when ? when.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : "s/f";
    const horaFmt = when ? when.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : "";
    const m = cacheMetodo[item.id] ?? normalizeMetodo(item);
    const st = normalizeEstado(item);
const estado = st.text;
const completada = st.isOk;



    const metodoPagoConfig = {
      efectivo: { icon: "", color: "#10B981", bg: "#D1FAE5" },
      tarjeta: { icon: "", color: "#3B82F6", bg: "#DBEAFE" },
      transferencia: { icon: "", color: "#8B5CF6", bg: "#EDE9FE" },
      desconocido: { icon: "", color: "#6B7280", bg: "#F3F4F6" }
    }[m];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => goDetail(item.id)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={completada ? ["#10B981", "#059669"] : ["#F59E0B", "#D97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.statusIndicator}
        />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Venta</Text>
              <Text style={styles.orderNumber}>#{item.orderNumber ?? item.id}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: completada ? "#D1FAE5" : "#FEF3C7" }]}>
              <View style={[styles.statusPulse, { backgroundColor: completada ? "#10B981" : "#F59E0B" }]} />
              <Text style={[styles.statusText, { color: completada ? "#059669" : "#D97706" }]}>
                {estado}
              </Text>
            </View>
          </View>

          <View style={styles.dateTimeRow}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{fechaFmt}</Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{horaFmt}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View style={[styles.methodBadge, { backgroundColor: metodoPagoConfig.bg }]}>
              <Text style={styles.methodIcon}>{metodoPagoConfig.icon}</Text>
              <Text style={[styles.methodText, { color: metodoPagoConfig.color }]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </View>
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${money(item.total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.arrowIndicator}>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Premium con gradiente */}
      <LinearGradient
        colors={["#1E293B", "#334155"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}> Historial</Text>
            <Text style={styles.subtitle}>Gestiona tus ventas</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalVentas}</Text>
            <Text style={styles.statLabel}>Ventas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${money(totalMonto)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Contenedor desplazable con filtros y lista */}
     <ScrollView
  style={styles.scrollContainer}
  showsVerticalScrollIndicator={false}
  bounces
  refreshControl={
    <RefreshControl refreshing={loading} onRefresh={load} />
  }
>
        <View style={styles.contentWrapper}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Buscar por número de orden..."
              value={q}
              onChangeText={setQ}
              style={styles.searchInput}
              autoCapitalize="characters"
              placeholderTextColor="#94A3B8"
            />
            {q ? (
              <TouchableOpacity onPress={() => setQ("")} style={styles.clearButton}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filters Section */}
          <View style={styles.filtersSection}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Método de pago</Text>
              {metodo !== "todos" && (
                <TouchableOpacity onPress={() => setMetodo("todos")}>
                  <Text style={styles.clearFilters}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.chipsContainer}>
              <FiltroChip 
                label="Todos" 
                icon=""
                active={metodo === "todos"} 
                onPress={() => setMetodo("todos")} 
              />
              <FiltroChip 
                label="Efectivo" 
                icon=""
                active={metodo === "efectivo"} 
                onPress={() => setMetodo("efectivo")} 
              />
              <FiltroChip 
                label="Tarjeta" 
                icon=""
                active={metodo === "tarjeta"} 
                onPress={() => setMetodo("tarjeta")} 
              />
              <FiltroChip 
                label="Transfer" 
                icon=""
                active={metodo === "transferencia"} 
                onPress={() => setMetodo("transferencia")} 
              />
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.dateSection}>
            <Text style={styles.filterTitle}>Rango de fechas</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateInputLabel}>Desde</Text>
                <TextInput
                  placeholder="2024-01-01"
                  value={desde}
                  onChangeText={setDesde}
                  style={styles.dateInput}
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateInputLabel}>Hasta</Text>
                <TextInput
                  placeholder="2024-12-31"
                  value={hasta}
                  onChangeText={setHasta}
                  style={styles.dateInput}
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>
        </View>
        {/* Lista de ventas */}
        <View style={styles.listWrapper}>
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Cargando ventas...</Text>
              <Text style={styles.emptySubtitle}>Espera un momento</Text>
            </View>
          ) : pageItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No hay ventas</Text>
              <Text style={styles.emptySubtitle}>Tus ventas aparecerán aquí</Text>
            </View>
          ) : (
            pageItems.map((item, index) => <Item key={item.id} item={item} index={index} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function FiltroChip({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.7}
    >
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { 
    fontSize: 34, 
    fontWeight: "900", 
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchIconText: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "600",
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
  },
  filtersSection: {
    marginBottom: 20,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  clearFilters: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B82F6",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  chipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  chipIcon: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  chipLabelActive: {
    color: "#FFFFFF",
  },
  dateSection: {
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateInput: {
    height: 48,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 15,
  },
  listWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  statusIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  cardContent: {
    padding: 20,
    marginLeft: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeIcon: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  methodIcon: {
    fontSize: 18,
  },
  methodText: {
    fontSize: 14,
    fontWeight: "800",
  },
  totalContainer: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#3B82F6",
  },
  arrowIndicator: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#64748B",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "600",
  },
});