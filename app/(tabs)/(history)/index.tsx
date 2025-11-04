import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform } from "react-native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import type { RootState } from "@/store";
import { getVentasByUsuario, VentaDetalleResumen, MetodoPago } from "@/src/services/salesApi";

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
/** Normaliza método de pago desde distintas claves/formatos */
const normalizeMetodo = (v: any): MetodoPago | "desconocido" => {
  const rawSrc =
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

export default function SalesHistoryScreen() {
  const router = useRouter();
  const usuarioId = useSelector((s: RootState) => s.auth.user?.userId ?? 0);

  const [loading, setLoading] = useState(false); // ← faltaba
  const [source, setSource] = useState<VentaDetalleResumen[]>([]);
  const [cacheMetodo, setCacheMetodo] = useState<Record<number, MetodoPago | "desconocido">>({});

  // filtros UI
  const [q, setQ] = useState("");
  const [metodo, setMetodo] = useState<FiltroMetodo>("todos");
  const [desde, setDesde] = useState<string>(""); // YYYY-MM-DD
  const [hasta, setHasta] = useState<string>(""); // YYYY-MM-DD

  // paginación local
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
      // precalcula y cachea método por id
      const map: Record<number, MetodoPago | "desconocido"> = {};
      for (const v of sorted) map[v.id] = normalizeMetodo(v);
      setCacheMetodo(map);

      setSource(sorted);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => { load(); }, [load]);

  // aplica filtros
  const filtered = useMemo(() => {
    const d0 = desde ? new Date(`${desde}T00:00:00`) : null;
    const d1 = hasta ? new Date(`${hasta}T23:59:59`) : null;

    return source.filter(v => {
      // método
      if (metodo !== "todos") {
        const m = cacheMetodo[v.id] ?? normalizeMetodo(v);
        if (m !== metodo) return false;
      }
      // texto
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const order = (v.orderNumber ?? v.numeroOrden ?? `${v.id}`).toString().toLowerCase();
        if (!order.includes(needle)) return false;
      }
      // rango fechas
      const f = dt(v.fecha_venta ?? v.created_at);
      if (f && (d0 || d1)) {
        if (d0 && f < d0) return false;
        if (d1 && f > d1) return false;
      }
      return true;
    });
  }, [source, metodo, q, desde, hasta, cacheMetodo]);

  // página actual
  const pageItems = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);

  const onEnd = () => {
    if (page * PAGE_SIZE < filtered.length) setPage(p => p + 1);
  };

  // Corrige la ruta al detalle del historial
  const goDetail = (ventaId: number) => {
    router.push(`/(tabs)/(history)/${ventaId}`);
  };

  const Item = ({ item }: { item: VentaDetalleResumen }) => {
    const when = dt(item.fecha_venta ?? item.created_at);
    const fechaFmt = when ? when.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : "s/f";
    const horaFmt = when ? when.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : "";
    const m = cacheMetodo[item.id] ?? normalizeMetodo(item);
    const estado = (item.estado ?? "n/d").toString();
    const completada = /^complet/i.test(estado) || estado === "Completada";

    const metodoPagoIcon = {
      efectivo: "",
      tarjeta: "",
      transferencia: "",
      desconocido: ""
    }[m];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => goDetail(item.id)}
        activeOpacity={0.65}
      >
        <View style={[styles.statusIndicator, completada ? styles.statusComplete : styles.statusPending]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}> Venta {item.orderNumber ?? `#${item.id}`}</Text>
            </View>
            <View style={[styles.statusChip, completada ? styles.statusChipComplete : styles.statusChipPending]}>
              <View style={[styles.statusDot, completada ? styles.dotComplete : styles.dotPending]} />
              <Text style={[styles.statusLabel, completada ? styles.statusLabelComplete : styles.statusLabelPending]}>
                {estado}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{fechaFmt}</Text>
            <Text style={styles.timeSeparator}>•</Text>
            <Text style={styles.timeText}>{horaFmt}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.methodContainer}>
              <Text style={styles.methodIcon}>{metodoPagoIcon}</Text>
              <Text style={styles.methodText}>{m}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${money(item.total)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header mejorado con gradiente visual */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}> Historial</Text>
          <Text style={styles.subtitle}>Gestiona tus ventas</Text>
        </View>
      </View>

      <View style={styles.contentWrapper}>
        {/* Búsqueda moderna */}
        <View style={styles.searchBox}>
          <View style={styles.searchIconContainer}>
          </View>
          <TextInput
            placeholder="Buscar orden..."
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
            autoCapitalize="characters"
            placeholderTextColor="#94A3B8"
          />
          {q ? (
            <TouchableOpacity onPress={() => setQ("")} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filtros de método */}
        <View style={styles.filtersSection}>
          <Text style={styles.filterTitle}>Método de pago</Text>
          <View style={styles.chipsContainer}>
            <FiltroChip label="Todos" active={metodo === "todos"} onPress={() => setMetodo("todos")} />
            <FiltroChip label="Efectivo" active={metodo === "efectivo"} onPress={() => setMetodo("efectivo")} />
            <FiltroChip label="Tarjeta" active={metodo === "tarjeta"} onPress={() => setMetodo("tarjeta")} />
            <FiltroChip label="Transferencia" active={metodo === "transferencia"} onPress={() => setMetodo("transferencia")} />
          </View>
        </View>

        {/* Rango de fechas */}
        <View style={styles.dateSection}>
          <Text style={styles.filterTitle}>Rango de fechas</Text>
          <View style={styles.dateRow2}>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>Desde</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={desde}
                onChangeText={setDesde}
                style={styles.dateInput}
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>Hasta</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
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
      <FlatList
        data={pageItems}
        keyExtractor={(it) => String(it.id)}
        renderItem={Item}
        contentContainerStyle={styles.listContent}
        onEndReached={onEnd}
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={load}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {loading ? "Cargando ventas..." : "No hay ventas"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {loading ? "Espera un momento" : "Tus ventas aparecerán aquí"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function FiltroChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F1F5F9" 
  },
  header: {
    backgroundColor: "#1E293B",
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {},
  title: { 
    fontSize: 32, 
    fontWeight: "900", 
    color: "#FFFFFF",
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "600",
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchBox: {
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
      android: {
        elevation: 3,
      },
    }),
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "600",
  },
  clearBtn: {
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
  filterTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
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
  dateRow2: {
    flexDirection: "row",
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  statusComplete: {
    backgroundColor: "#10B981",
  },
  statusPending: {
    backgroundColor: "#F59E0B",
  },
  cardContent: {
    padding: 18,
    marginLeft: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  orderBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  orderText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusChipComplete: {
    backgroundColor: "#D1FAE5",
  },
  statusChipPending: {
    backgroundColor: "#FEF3C7",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotComplete: {
    backgroundColor: "#10B981",
  },
  dotPending: {
    backgroundColor: "#F59E0B",
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusLabelComplete: {
    color: "#059669",
  },
  statusLabelPending: {
    color: "#D97706",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
  },
  timeSeparator: {
    fontSize: 14,
    color: "#CBD5E1",
    marginHorizontal: 8,
    fontWeight: "700",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  methodContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  methodIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  methodText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "capitalize",
  },
  totalBox: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#3B82F6",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
    color: "#94A3B8",
    fontWeight: "600",
  },
});