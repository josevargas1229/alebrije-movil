// app/(tabs)/new-sale.tsx
import React, { useEffect, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  startNewOrder,
  updateCustomer,
  loadDraftFromStorage,
  persistDraftToStorage,
  clearDraftFromStorage,
} from "../../store/slices/salesSlice";
import ThemedTextInput from "../../components/ThemedTextInput";
import ThemedButton from "../../components/ThemedButton";

type Errors = {
  nombre?: string;
  telefono?: string;
  email?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const onlyDigits = (s: string) => s.replace(/\D+/g, "");

export default function NewSaleScreen() {
  const dispatch = useDispatch<any>();
  const { draft, loading } = useSelector((s: RootState) => s.sales);

  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    dispatch(loadDraftFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && !draft) {
      dispatch(startNewOrder());
      dispatch(persistDraftToStorage());
    }
  }, [loading, draft, dispatch]);

  const validate = useCallback(
    (partial?: { nombre?: string; telefono?: string; email?: string }) => {
      if (!draft) return {};
      const c = {
        nombre: partial?.nombre ?? draft.customer?.nombre ?? "",
        telefono: partial?.telefono ?? draft.customer?.telefono ?? "",
        email: partial?.email ?? draft.customer?.email ?? "",
      };

      const next: Errors = {};
      if (c.nombre && c.nombre.trim().length < 3) {
        next.nombre = "El nombre debe tener al menos 3 caracteres.";
      }
      if (c.telefono) {
        const digits = onlyDigits(c.telefono);
        if (digits.length < 7 || digits.length > 15) {
          next.telefono = "El teléfono debe tener entre 7 y 15 dígitos.";
        }
      }
      if (c.email && !emailRegex.test(c.email)) {
        next.email = "Correo electrónico inválido.";
      }
      return next;
    },
    [draft]
  );

  const onChangeCustomer = useCallback(
    (partial: any) => {
      dispatch(updateCustomer(partial));

      const fieldErrors = validate(partial);

      setErrors((prev) => {
        const next = { ...prev, ...fieldErrors };
        Object.keys(partial).forEach((k) => {
          if (!fieldErrors[k as keyof Errors]) {
            delete next[k as keyof Errors];
          }
        });
        return next;
      });

      dispatch(persistDraftToStorage());
    },
    [dispatch, validate]
  );

  const hasErrors = useMemo(
    () => Boolean(errors.nombre || errors.telefono || errors.email),
    [errors]
  );

  if (!draft) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.skeleton}>Cargando borrador…</Text>
      </SafeAreaView>
    );
  }

  const createdAt = new Date(draft.createdAt);
  const createdStr = `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}`;

  const handleSave = async () => {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      Alert.alert("Revisa los campos", "Corrige los errores antes de guardar.");
      return;
    }

    try {
      await dispatch(persistDraftToStorage());
      Alert.alert("Guardado", "Borrador guardado localmente.");
      await dispatch(clearDraftFromStorage());
      await dispatch(startNewOrder());
      await dispatch(persistDraftToStorage());
      setErrors({});
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el borrador.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header fijo que se adapta a todos los dispositivos */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva venta</Text>
      </View>

      {/* Contenido con scroll */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen */}
        <View style={styles.card}>
          <View style={styles.cardRowBetween}>
            <Text style={styles.cardTitle}>Resumen del pedido</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {draft.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Número de orden </Text>
            <Text style={styles.metaValue}>{draft.orderNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Fecha de creación</Text>
            <Text style={styles.metaValue}>{createdStr}</Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Información del cliente
          </Text>
          <Text style={styles.cardSubtitle}>
            Completa los datos del cliente
          </Text>
          <View style={{ height: 16 }} />

          <Text style={styles.label}>Nombre completo</Text>
          <ThemedTextInput
            placeholder="Ingresa el nombre del cliente"
            value={draft.customer?.nombre || ""}
            onChangeText={(v) => onChangeCustomer({ nombre: v })}
            style={[
              styles.input,
              errors.nombre ? styles.inputErrorBorder : null,
            ]}
          />
          {errors.nombre ? (
            <Text style={styles.errorText}>{errors.nombre}</Text>
          ) : (
            <Text style={styles.helper}>Como aparece en factura o recibo</Text>
          )}

          <View style={{ height: 16 }} />
          
          <Text style={styles.label}>Teléfono</Text>
          <ThemedTextInput
            placeholder="Número de contacto"
            value={draft.customer?.telefono || ""}
            onChangeText={(v) => onChangeCustomer({ telefono: v })}
            keyboardType="phone-pad"
            style={[
              styles.input,
              errors.telefono ? styles.inputErrorBorder : null,
            ]}
          />
          {errors.telefono ? (
            <Text style={styles.errorText}>{errors.telefono}</Text>
          ) : (
            <Text style={styles.helper}>Entre 7 y 15 dígitos</Text>
          )}

          <View style={{ height: 16 }} />
          
          <Text style={styles.label}>Correo electrónico</Text>
          <ThemedTextInput
            placeholder="ejemplo@correo.com"
            value={draft.customer?.email || ""}
            onChangeText={(v) => onChangeCustomer({ email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              errors.email ? styles.inputErrorBorder : null,
            ]}
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : (
            <Text style={styles.helper}>Para enviar confirmaciones y documentos</Text>
          )}
        </View>
      </ScrollView>

      {/* Botones fijos en la parte inferior */}
      <View style={styles.actionsBar}>
        <ThemedButton
          title="Descartar"
          onPress={() => {
            Alert.alert("Descartar borrador", "¿Estás seguro de eliminar?", [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                  await dispatch(clearDraftFromStorage());
                  await dispatch(startNewOrder());
                  await dispatch(persistDraftToStorage());
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
          style={[styles.btnPrimary, hasErrors && { opacity: 0.5 }]}
          disabled={hasErrors}
        />
      </View>
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
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: { 
    justifyContent: "center", 
    alignItems: "center" 
  },
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  skeleton: { 
    color: "#64748B",
    fontSize: 15 
  },

  // Header que se adapta y llena hasta arriba
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#1e3a8a",
  },
  headerTitle: { 
    color: "#fff", 
    fontSize: 24, 
    fontWeight: "700",
    letterSpacing: 0.3
  },

  scrollContainer: {
    flex: 1,
  },

  scroll: { 
    padding: 20,
    paddingBottom: 100, // Espacio extra para que el último campo no quede tapado por los botones
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOW,
  },
  cardRowBetween: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  cardTitle: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#0F172A",
    letterSpacing: 0.2
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6
  },

  badge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  badgeText: { 
    color: "#1e3a8a", 
    fontWeight: "600", 
    fontSize: 12, 
    textTransform: "capitalize" 
  },

  separator: { 
    height: 1, 
    backgroundColor: "#E2E8F0", 
    marginVertical: 14 
  },

  metaRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 10,
    paddingVertical: 2
  },
  metaLabel: { 
    color: "#64748B", 
    fontSize: 14,
    fontWeight: "500"
  },
  metaValue: { 
    color: "#0F172A", 
    fontSize: 14, 
    fontWeight: "600" 
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#0F172A"
  },
  inputErrorBorder: { 
    borderColor: "#EF4444",
    borderWidth: 1.5
  },
  helper: { 
    marginTop: 6, 
    fontSize: 13, 
    color: "#64748B",
    fontStyle: "italic"
  },
  errorText: { 
    marginTop: 6, 
    fontSize: 13, 
    color: "#EF4444",
    fontWeight: "500"
  },

  actionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
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
});