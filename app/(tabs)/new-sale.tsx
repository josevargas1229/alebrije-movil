import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Switch,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  startNewOrder,
  setRecogerEnTienda,
  setDireccion,
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
  const activeSaleId = useSelector((s: RootState) => s.sales.activeSaleId); // <-- opcional: ver puntero global

  // Formulario opcional de cliente (estado local)
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
        <Text style={styles.muted}>Cargando borrador…</Text>
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

    // Dirección (opcional)
    if (draft.direccion_id !== null && draft.direccion_id !== undefined) {
      if (!Number.isInteger(draft.direccion_id) || draft.direccion_id <= 0) {
        next.direccion_id =
          "La dirección debe ser un ID numérico válido (> 0) o dejarse vacío.";
      } else {
        delete next.direccion_id;
      }
    }

    // Cliente (solo valida si hay valores)
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
    // Reset borrador y formulario
    dispatch(clearDraft());
    dispatch(startNewOrder());
    setCustomer({ nombre: "", telefono: "", email: "" });
    setErrors({});
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva venta</Text>
        <Text style={styles.headerSubtitle}>
          Estado: {draft.status.replace("_", " ")}
          {activeSaleId ? ` · Activa: ${activeSaleId.slice(0, 6)}` : ""}
        </Text>
      </View>

      {/* Productos en la venta */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Productos en la venta</Text>
        <View style={{ height: 12 }} />
        {draft.productos.length === 0 ? (
          <Text style={{ color: "#64748B" }}>
            Aún no hay productos. Agrégalos desde el detalle.
          </Text>
        ) : (
          draft.productos.map((p, i) => {
            const subtotal = (p.precio_unitario || 0) * p.cantidad;
            // Usa etiquetas legibles si vienen adjuntas desde qrcode.tsx
            const tallaDisplay = (p as any).talla_label ?? p.talla_id;
            const colorDisplay = (p as any).color_label ?? p.color_id;
            return (
              <View
                key={`${p.producto_id}-${p.talla_id}-${p.color_id}-${i}`}
                style={{
                  paddingVertical: 8,
                  borderBottomWidth: i === draft.productos.length - 1 ? 0 : 1,
                  borderBottomColor: "#E2E8F0",
                }}
              >
                <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                  Prod #{p.producto_id} · Talla {tallaDisplay} · Color{" "}
                  {colorDisplay}
                </Text>
                <Text style={{ color: "#334155" }}>
                  Cant: {p.cantidad} | PU: $
                  {Number(p.precio_unitario || 0).toFixed(2)} | Subtotal: $
                  {subtotal.toFixed(2)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen */}
        <View style={styles.card}>
          <View style={styles.cardRowBetween}>
            <Text style={styles.cardTitle}>Resumen</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{draft.orderNumber}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <Row label="Fecha de creación" value={createdStr} />
          <Row label="Productos" value={String(draft.productos.length)} />
          <Row label="Total" value={`$ ${draft.total.toFixed(2)}`} />
        </View>

        {/* Cliente (opcional) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos del cliente (opcional)</Text>
          <View style={{ height: 12 }} />

          <Text style={styles.label}>Nombre completo</Text>
          <ThemedTextInput
            placeholder="Ingresa el nombre del cliente"
            value={customer.nombre}
            onChangeText={(v) => {
              setCustomer((c) => ({ ...c, nombre: v }));
              validateCustomerField({ nombre: v });
            }}
            style={[styles.input, errors.nombre ? styles.inputError : null]}
          />
          {errors.nombre ? (
            <Text style={styles.errorText}>{errors.nombre}</Text>
          ) : (
            <Text style={styles.helper}>Como aparece en factura o recibo.</Text>
          )}

          <View style={{ height: 16 }} />

          <Text style={styles.label}>Teléfono</Text>
          <ThemedTextInput
            placeholder="Número de contacto"
            value={customer.telefono}
            onChangeText={(v) => {
              setCustomer((c) => ({ ...c, telefono: v }));
              validateCustomerField({ telefono: v });
            }}
            keyboardType="phone-pad"
            style={[styles.input, errors.telefono ? styles.inputError : null]}
          />
          {errors.telefono ? (
            <Text style={styles.errorText}>{errors.telefono}</Text>
          ) : (
            <Text style={styles.helper}>Entre 7 y 15 dígitos.</Text>
          )}

          <View style={{ height: 16 }} />

          <Text style={styles.label}>Correo electrónico</Text>
          <ThemedTextInput
            placeholder="ejemplo@correo.com"
            value={customer.email}
            onChangeText={(v) => {
              setCustomer((c) => ({ ...c, email: v }));
              validateCustomerField({ email: v });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, errors.email ? styles.inputError : null]}
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : (
            <Text style={styles.helper}>
              Para enviar confirmaciones y documentos.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Acciones */}
      <View style={styles.actionsBar}>
        <ThemedButton
          title="Descartar"
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
          style={styles.btnSecondary}
        />
        <ThemedButton
          title="Proceder a la venta"
          onPress={handleSave}
          style={[styles.btnPrimary, hasErrors && { opacity: 0.6 }]}
          disabled={hasErrors}
        />
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { justifyContent: "center", alignItems: "center" },
  muted: { color: "#64748B" },

  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#1e3a8a",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    fontSize: 13,
  },

  scroll: { flex: 1 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOW,
  },
  cardRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  badge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  badgeText: { color: "#1e3a8a", fontWeight: "700", fontSize: 12 },

  separator: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 12 },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metaLabel: { color: "#64748B", fontSize: 13 },
  metaValue: { color: "#0F172A", fontSize: 14, fontWeight: "600" },

  label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#0F172A",
  },
  inputError: { borderColor: "#EF4444", borderWidth: 1.5 },
  helper: { marginTop: 6, fontSize: 12, color: "#64748B" },
  errorText: { marginTop: 6, fontSize: 12, color: "#EF4444" },

  actionsBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    gap: 12,
    ...SHADOW,
  },
  btnPrimary: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e3a8a",
  },
  btnSecondary: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#64748B",
  },

  paramRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paramLabel: { fontSize: 14, fontWeight: "600", color: "#334155" },
});
