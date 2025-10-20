import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  startNewOrder,
  clearDraft,
} from "@/store/slices/salesSlice";
import ThemedTextInput from "@/components/ThemedTextInput";
import ThemedButton from "@/components/ThemedButton";

type Errors = {
  direccion_id?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
};

const onlyDigits = (s: string) => s.replace(/\D+/g, "");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewSaleScreen() {
  const dispatch = useDispatch<any>();
  const draft = useSelector((s: RootState) => s.sales.draft);
  const activeSaleId = useSelector((s: RootState) => s.sales.activeSaleId);

  const [customer, setCustomer] = useState({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!draft) dispatch(startNewOrder());
  }, [dispatch, draft]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  if (!draft) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.loadingCard}>
          <View style={styles.loadingDot} />
          <Text style={styles.loadingText}>Preparando nueva venta...</Text>
        </View>
      </View>
    );
  }

  const createdAt = new Date(draft.createdAt);
  const createdStr = `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}`;

  const validateCustomerField = (patch: Partial<typeof customer>) => {
    const next: Errors = { ...errors };
    if (patch.nombre !== undefined) {
      if (patch.nombre && patch.nombre.trim().length < 3)
        next.nombre = "El nombre debe tener al menos 3 caracteres.";
      else delete next.nombre;
    }
    if (patch.telefono !== undefined) {
      const digits = onlyDigits(patch.telefono);
      if (patch.telefono && (digits.length < 7 || digits.length > 15))
        next.telefono = "El teléfono debe tener entre 7 y 15 dígitos.";
      else delete next.telefono;
    }
    if (patch.email !== undefined) {
      if (patch.email && !emailRegex.test(patch.email))
        next.email = "Correo electrónico inválido.";
      else delete next.email;
    }
    setErrors(next);
  };

  const handleSave = () => {
    const next: Errors = { ...errors };

    if (draft.direccion_id !== null && draft.direccion_id !== undefined) {
      if (!Number.isInteger(draft.direccion_id) || draft.direccion_id <= 0) {
        next.direccion_id =
          "La dirección debe ser un ID numérico válido (> 0) o dejarse vacío.";
      } else {
        delete next.direccion_id;
      }
    }

    if (customer.nombre && customer.nombre.trim().length < 3)
      next.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (customer.telefono) {
      const d = onlyDigits(customer.telefono);
      if (d.length < 7 || d.length > 15)
        next.telefono = "El teléfono debe tener entre 7 y 15 dígitos.";
    }
    if (customer.email && !emailRegex.test(customer.email))
      next.email = "Correo electrónico inválido.";

    setErrors(next);
    if (Object.keys(next).length) {
      Alert.alert("Revisa los campos", "Corrige los errores antes de guardar.");
      return;
    }

    Alert.alert("Guardado", "Borrador guardado (en memoria Redux).");
    dispatch(clearDraft());
    dispatch(startNewOrder());
    setCustomer({ nombre: "", telefono: "", email: "" });
    setErrors({});
  };

  const totalProductos = draft.productos.reduce((sum, p) => sum + p.cantidad, 0);
  const statusLabel: Record<"en_proceso" | "finalizada" | "cancelada", string> = {
  en_proceso: "Borrador",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header Mejorado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Nueva Venta</Text>
            <Text style={styles.headerSubtitle}>
              {draft.orderNumber}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
          <Text style={styles.statusText}>{statusLabel[draft.status]}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Resumen Principal */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Productos</Text>
              <Text style={styles.summaryValue}>{draft.productos.length}</Text>
              <Text style={styles.summarySubtext}>{totalProductos} unidades</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValuePrice}>
                ${draft.total.toFixed(2)}
              </Text>
              <Text style={styles.summarySubtext}>{createdAt.toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Lista de Productos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Productos</Text>
          </View>
          
          {draft.productos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No hay productos</Text>
              <Text style={styles.emptyText}>
                Agrega productos a esta venta para continuar
              </Text>
            </View>
          ) : (
            <View style={styles.productsList}>
              {draft.productos.map((p, i) => {
                const subtotal = (p.precio_unitario || 0) * p.cantidad;
                const tallaDisplay = (p as any).talla_label ?? p.talla_id;
                const colorDisplay = (p as any).color_label ?? p.color_id;
                const productDisplay =
                  (p as any).producto_nombre ?? `Producto #${p.producto_id}`;
                
                return (
                  <View
                    key={`${p.producto_id}-${p.talla_id}-${p.color_id}-${i}`}
                    style={[
                      styles.productItem,
                      i === draft.productos.length - 1 && styles.productItemLast
                    ]}
                  >
                    <View style={styles.productHeader}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productLabel}>Producto:</Text>
                        <Text style={styles.productName}>{productDisplay}</Text>
                        <View style={styles.productDetails}>
                          <View style={styles.productTag}>
                            <Text style={styles.productTagText}>
                              Talla {tallaDisplay}
                            </Text>
                          </View>
                          <View style={styles.productTag}>
                            <Text style={styles.productTagText}>
                              {colorDisplay}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.productFooter}>
                      <View style={styles.quantityBadge}>
                        <Text style={styles.quantityText}>
                          {p.cantidad} {p.cantidad === 1 ? 'unidad' : 'unidades'}
                        </Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>
                          ${Number(p.precio_unitario || 0).toFixed(2)} c/u
                        </Text>
                        <Text style={styles.priceTotal}>
                          ${subtotal.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Datos del Cliente */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Cliente</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>Opcional</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <Text style={styles.labelIcon}></Text> Nombre completo
            </Text>
            <ThemedTextInput
              placeholder="Ej: Juan Pérez García"
              value={customer.nombre}
              onChangeText={(v) => {
                setCustomer((c) => ({ ...c, nombre: v }));
                validateCustomerField({ nombre: v });
              }}
              style={[styles.input, errors.nombre && styles.inputError]}
            />
            {errors.nombre && (
              <Text style={styles.errorText}>{errors.nombre}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <Text style={styles.labelIcon}></Text> Teléfono
            </Text>
            <ThemedTextInput
              placeholder="Ej: 2281234567"
              value={customer.telefono}
              onChangeText={(v) => {
                setCustomer((c) => ({ ...c, telefono: v }));
                validateCustomerField({ telefono: v });
              }}
              keyboardType="phone-pad"
              style={[styles.input, errors.telefono && styles.inputError]}
            />
            {errors.telefono && (
              <Text style={styles.errorText}>{errors.telefono}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <Text style={styles.labelIcon}></Text> Correo electrónico
            </Text>
            <ThemedTextInput
              placeholder="ejemplo@correo.com"
              value={customer.email}
              onChangeText={(v) => {
                setCustomer((c) => ({ ...c, email: v }));
                validateCustomerField({ email: v });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, errors.email && styles.inputError]}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}></Text>
            <Text style={styles.infoText}>
            Los datos del cliente son opcionales pero ayudan a enviar confirmaciones y mantener historial
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Barra de Acciones Mejorada */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => {
            Alert.alert("Descartar borrador", "¿Eliminar el borrador actual?", [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: () => {
                  dispatch(clearDraft());
                  dispatch(startNewOrder());
                  setCustomer({ nombre: "", telefono: "", email: "" });
                  setErrors({});
                },
              },
            ]);
          }}
        >
          <Text style={styles.btnSecondaryText}>Descartar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnPrimary, hasErrors && styles.btnDisabled]}
          onPress={handleSave}
          disabled={hasErrors}
        >
          <Text style={styles.btnPrimaryText}>
            Proceder a la venta →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

const LIGHT_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F1F5F9" 
  },
  center: { 
    justifyContent: "center", 
    alignItems: "center" 
  },

  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    ...SHADOW,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1e40af",
    marginBottom: 16,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 16,
  },

  header: {
    backgroundColor: "#1e40af",
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOW,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { 
    color: "#fff", 
    fontSize: 28, 
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  scroll: { 
    flex: 1 
  },
  scrollContent: { 
    padding: 20, 
    paddingTop: 16,
    paddingBottom: 120 
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...SHADOW,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  summaryValuePrice: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e40af",
    marginBottom: 4,
    fontVariant: ["tabular-nums"],
  },
  summarySubtext: {
    fontSize: 12,
    color: "#94A3B8",
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...SHADOW,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#0F172A" 
  },
  
  addButton: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  addButtonText: {
    color: "#1e40af",
    fontWeight: "700",
    fontSize: 13,
  },

  optionalBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  optionalText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  productsList: {
    gap: 0,
  },
  productItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  productItemLast: {
    borderBottomWidth: 0,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: "row",
    gap: 8,
  },
  productTag: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  productTagText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#DC2626",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 24,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quantityText: {
    color: "#1e40af",
    fontSize: 13,
    fontWeight: "700",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  priceTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
  },

  formGroup: {
    marginBottom: 20,
  },
  label: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#334155", 
    marginBottom: 10,
  },
  labelIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    fontSize: 15,
    color: "#0F172A",
  },
  inputError: { 
    borderColor: "#EF4444", 
    backgroundColor: "#FEF2F2",
  },
  errorText: { 
    marginTop: 8, 
    fontSize: 13, 
    color: "#EF4444",
    fontWeight: "600",
  },

  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F0F9FF",
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
    gap: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#0369A1",
    lineHeight: 18,
  },

  actionsBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    gap: 12,
    ...SHADOW,
  },
  btnPrimary: {
    flex: 2,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e40af",
    ...LIGHT_SHADOW,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  btnSecondary: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  btnSecondaryText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.5,
  },
});