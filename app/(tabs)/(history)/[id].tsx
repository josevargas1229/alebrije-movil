import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getVentaById } from "@/src/services/salesApi";

const num = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
};
const money = (v: unknown) => num(v).toFixed(2);

const normalizeMetodo = (venta: any): "efectivo" | "tarjeta" | "transferencia" | "desconocido" => {
  const rawSrc =
    venta?.metodo_pago ??
    venta?.metodo ??
    venta?.payment_method ??
    venta?.metodoPago ??
    venta?.transaccion?.metodo_pago ??
    venta?.transacciones?.[0]?.metodo_pago ??
    "";
  const raw = String(rawSrc).trim().toLowerCase();
  if (raw.startsWith("efec")) return "efectivo";
  if (raw.startsWith("tarj") || raw === "card") return "tarjeta";
  if (raw.startsWith("trans") || raw.includes("spei") || raw.includes("transfer")) return "transferencia";
  return "desconocido";
};

export default function VentaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const v = await getVentaById(Number(id));
        if (mounted) setVenta(v);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!venta) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>{loading ? "Cargando venta..." : "Venta no encontrada"}</Text>
          {!loading && (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const when = venta.fecha_venta || venta.created_at;
  const fecha = when ? new Date(when) : null;
  const fechaFmt = fecha
    ? fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
    : "s/f";
  const horaFmt = fecha ? fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";

  const estado = String(venta.estado ?? "Pendiente");
  const completada = /^complet/i.test(estado) || estado === "Completada";

  const detalles: any[] = Array.isArray(venta.detalles) ? venta.detalles : [];
  const subtotal = detalles.reduce((sum, item) => sum + num(item?.subtotal), 0);
  const total = num(venta.total);

  const metodo = normalizeMetodo(venta);
  const metodoIcon = metodo === "efectivo" ? "" : metodo === "tarjeta" ? "" : metodo === "transferencia" ? "" : "";
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Detalle de Venta</Text>
          <Text style={styles.headerSubtitle}>{venta.orderNumber ?? `#${venta.id}`}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Card principal */}
        <View style={styles.mainCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, completada ? styles.statusComplete : styles.statusPending]}>
              <View style={[styles.statusDot, completada ? styles.dotComplete : styles.dotPending]} />
              <Text style={[styles.statusText, completada ? styles.statusTextComplete : styles.statusTextPending]}>
                {estado}
              </Text>
            </View>
          </View>

          {/* Fecha */}
          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fecha</Text>
              <Text style={styles.infoValue}>{fechaFmt}</Text>
              <Text style={styles.infoTime}>{horaFmt}</Text>
            </View>
          </View>

          {/* Método de pago */}
          {metodo !== "desconocido" && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>{metodoIcon}</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Método de pago</Text>
                <Text style={[styles.infoValue, { textTransform: "capitalize" }]}>{metodo}</Text>
              </View>
            </View>
          )}

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total de la venta</Text>
            <Text style={styles.totalAmount}>
              ${money(total)} <Text style={styles.currency}>MXN</Text>
            </Text>
          </View>
        </View>

        {/* Productos */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>  Productos</Text>
            <View style={styles.productCountBadge}>
              <Text style={styles.productCountText}>{detalles.length}</Text>
            </View>
          </View>

          {detalles.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyText}>Sin productos en esta venta</Text>
            </View>
          ) : (
            detalles.map((item, index) => (
              <View key={item?.id ?? index} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item?.producto?.tipoProducto?.nombre ?? "Producto"}</Text>
                    <View style={styles.productDetails}>
                      <View style={styles.detailChip}>
                        <Text style={styles.detailLabel}>Talla:</Text>
                        <Text style={styles.detailValue}>{item?.talla?.talla ?? "n/d"}</Text>
                      </View>
                      <View style={styles.detailChip}>
                        <Text style={styles.detailLabel}>Color:</Text>
                        <Text style={styles.detailValue}>{item?.color?.color ?? "n/d"}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.productFooter}>
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabel}>Cantidad</Text>
                    <Text style={styles.quantityValue}>×{num(item?.cantidad)}</Text>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Subtotal</Text>
                    <Text style={styles.priceValue}>${money(item?.subtotal)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Resumen */}
        {detalles.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${money(subtotal)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>${money(total)}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
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
  loadingIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 20,
    padding: 20,
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
  statusRow: {
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  statusComplete: {
    backgroundColor: "#D1FAE5",
  },
  statusPending: {
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
  statusText: {
    fontSize: 14,
    fontWeight: "800",
  },
  statusTextComplete: {
    color: "#059669",
  },
  statusTextPending: {
    color: "#D97706",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconText: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  infoTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  totalCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#BFDBFE",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3B82F6",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1E40AF",
  },
  currency: {
    fontSize: 20,
    fontWeight: "700",
    color: "#60A5FA",
  },
  productsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  productCountBadge: {
    backgroundColor: "#3B82F6",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  productCountText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  emptyProducts: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#94A3B8",
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  productHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  productIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  productEmoji: {
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: "row",
    gap: 8,
  },
  detailChip: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  quantityBox: {
    alignItems: "flex-start",
  },
  quantityLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#64748B",
  },
  priceBox: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#3B82F6",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  summaryValueTotal: {
    fontSize: 24,
    fontWeight: "900",
    color: "#3B82F6",
  },
});