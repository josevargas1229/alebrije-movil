import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Keyboard } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import { setStatus, clearDraft } from "@/store/slices/salesSlice";
import type { VentaProducto } from "@/store/slices/salesSlice";
import { createVenta } from "@/src/services/salesApi";
import axiosClient, { setAuthHeader } from "@/api/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MetodoPago = "efectivo" | "tarjeta" | "transferencia";
type TarjetaData = {
  nombre: string;
  numero: string;       
  vencimiento: string; 
  cvv: string;    
};

type TransferenciaData = {
  banco: string;
  referencia: string;
  titular: string;
};

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sale = useSelector((s: RootState) => (id ? s.sales.drafts[id] : null));
  const dispatch = useDispatch();
  const router = useRouter();
  const authUserId = useSelector((s: RootState) => s.auth.user?.userId ?? null);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState<string>("");
  const [tarjeta, setTarjeta] = useState<TarjetaData>({
    nombre: "", numero: "", vencimiento: "", cvv: ""
  });
  const [transfer, setTransfer] = useState<TransferenciaData>({
    banco: "", referencia: "", titular: ""
  });
  const total = sale?.total ?? 0;
  const recibidoNumber = useMemo(
    () => Number(montoRecibido.replace(/,/g, ".")) || 0,
    [montoRecibido]
  );
  const cambio = useMemo(
    () => Math.max(0, +(recibidoNumber - total).toFixed(2)),
    [recibidoNumber, total]
  );

  if (!sale) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Venta no encontrada.</Text>
      </View>
    );
  }
  
  const efectivoValido = metodo !== "efectivo" || recibidoNumber >= total;
  const tarjetaValida =
    metodo !== "tarjeta" ||
    (tarjeta.nombre.trim().length >= 3 &&
     /^[0-9]{13,19}$/.test(tarjeta.numero.replace(/\s+/g, "")) &&
     /^(0[1-9]|1[0-2])\/\d{2}$/.test(tarjeta.vencimiento.trim()) &&
     /^[0-9]{3,4}$/.test(tarjeta.cvv.trim()));

  const transferenciaValida =
    metodo !== "transferencia" ||
    (transfer.banco.trim().length > 1 &&
     transfer.referencia.trim().length >= 6 &&
     transfer.titular.trim().length >= 3);
  const metodoOk =
    metodo === "efectivo" ? efectivoValido :
    metodo === "tarjeta" ? tarjetaValida :
    transferenciaValida;

  const puedeConfirmar = sale.productos.length > 0 && total > 0 && metodoOk;

  const onConfirm = async () => {
    try {
      if (!puedeConfirmar) {
        Alert.alert("Datos incompletos", "Verifica el método de pago y los importes.");
        return;
      }
      if (!authUserId) {
        Alert.alert("Sesión requerida", "Inicia sesión para registrar la venta.");
        return;
      }

      let auth = (axiosClient.defaults.headers.common.Authorization as string) || "";
      if (!auth) {
        const t = await AsyncStorage.getItem("auth_token");
        if (t) { setAuthHeader(t); auth = `Bearer ${t}`; }
      }

      const payload = {
        usuario_id: authUserId,
        total: +total.toFixed(2),
        productos: sale.productos.map((p: VentaProducto) => ({
          producto_id: Number(p.producto_id),
          talla_id: Number(p.talla_id),
          color_id: Number(p.color_id),
          cantidad: Number(p.cantidad),
          precio_unitario: typeof p.precio_unitario === "number" ? p.precio_unitario : 0,
        })),
        recogerEnTienda: !!sale.recogerEnTienda,
        direccion_id: sale.direccion_id != null ? Number(sale.direccion_id) : null,
        metodo_pago: metodo,
      };

      const resp = await createVenta(payload);
      const ventaId = resp?.venta?.id;
      if (ventaId) {
        await AsyncStorage.setItem(`ventaMetodo:${ventaId}`, metodo);
      }

      dispatch(setStatus({ id: sale.id, status: "finalizada" }));
      dispatch(clearDraft(sale.id));

      Alert.alert(
        "Venta registrada",
        `Método: ${metodo}${metodo === "efectivo" ? ` | Cambio: $${cambio.toFixed(2)}` : ""}`,
        [{ text: "OK", onPress: () => router.replace("/(tabs)/(history)") }]
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "No se pudo registrar la venta.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Procesar pago</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Total a pagar</Text>
        <Text style={styles.total}>${total.toFixed(2)} MXN</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Método de pago</Text>
        <View style={styles.row}>
          <MetodoButton label="Efectivo" active={metodo === "efectivo"} onPress={() => setMetodo("efectivo")} />
          <MetodoButton label="Tarjeta" active={metodo === "tarjeta"} onPress={() => setMetodo("tarjeta")} />
          <MetodoButton label="Transferencia" active={metodo === "transferencia"} onPress={() => setMetodo("transferencia")} />
        </View>

        {metodo === "efectivo" && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sublabel}>Monto recibido</Text>
            <TextInput
              placeholder="0.00"
              keyboardType="decimal-pad"
              returnKeyType="done"
              value={montoRecibido}
              onChangeText={setMontoRecibido}
              onSubmitEditing={() => Keyboard.dismiss()}
              style={[styles.input, recibidoNumber < total && styles.inputError]}
            />
            <View style={styles.inline}>
              <Text style={styles.muted}>Cambio:</Text>
              <Text style={styles.change}>${cambio.toFixed(2)}</Text>
            </View>
            {recibidoNumber < total && (
              <Text style={styles.error}>El monto recibido no cubre el total.</Text>
            )}
          </View>
        )}

        {metodo === "tarjeta" && (
          <View style={{ marginTop: 16, gap: 8 }}>
            <Text style={styles.sublabel}>Nombre en la tarjeta</Text>
            <TextInput
              placeholder="Ej: Juan Pérez"
              value={tarjeta.nombre}
              returnKeyType="next"
              onChangeText={(v) => setTarjeta(t => ({ ...t, nombre: v }))}
              onSubmitEditing={() => Keyboard.dismiss()}
              style={[styles.input, tarjeta.nombre.trim().length < 3 && styles.inputError]}
            />

            <Text style={styles.sublabel}>Número</Text>
            <TextInput
              placeholder="16 dígitos"
              keyboardType="number-pad"
              returnKeyType="next"
              value={tarjeta.numero}
              onChangeText={(v) => setTarjeta(t => ({ ...t, numero: v }))}
              onSubmitEditing={() => Keyboard.dismiss()}
              style={[
                styles.input,
                !/^[0-9]{13,19}$/.test(tarjeta.numero.replace(/\s+/g, "")) && styles.inputError
              ]}
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sublabel}>Vencimiento (MM/AA)</Text>
                <TextInput
                  placeholder="MM/AA"
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                  value={tarjeta.vencimiento}
                  onChangeText={(v) => setTarjeta(t => ({ ...t, vencimiento: v }))}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  style={[
                    styles.input,
                    !/^(0[1-9]|1[0-2])\/\d{2}$/.test(tarjeta.vencimiento.trim()) && styles.inputError
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sublabel}>CVV</Text>
                <TextInput
                  placeholder="3 o 4 dígitos"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  value={tarjeta.cvv}
                  onChangeText={(v) => setTarjeta(t => ({ ...t, cvv: v }))}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  style={[
                    styles.input,
                    !/^[0-9]{3,4}$/.test(tarjeta.cvv.trim()) && styles.inputError
                  ]}
                />
              </View>
            </View>

            {!tarjetaValida && <Text style={styles.error}>Completa los datos de la tarjeta.</Text>}
          </View>
        )}

        {metodo === "transferencia" && (
          <View style={{ marginTop: 16, gap: 8 }}>
            <Text style={styles.sublabel}>Banco</Text>
            <TextInput
              placeholder="Ej: BBVA"
              value={transfer.banco}
              returnKeyType="next"
              onChangeText={(v) => setTransfer(t => ({ ...t, banco: v }))}
              onSubmitEditing={() => Keyboard.dismiss()}
              style={[styles.input, transfer.banco.trim().length < 2 && styles.inputError]}
            />

            <Text style={styles.sublabel}>Referencia</Text>
            <TextInput
              placeholder="Referencia de pago"
              value={transfer.referencia}
              returnKeyType="next"
              onChangeText={(v) => setTransfer(t => ({ ...t, referencia: v }))}
              onSubmitEditing={() => Keyboard.dismiss()}
              style={[styles.input, transfer.referencia.trim().length < 6 && styles.inputError]}
            />

            <Text style={styles.sublabel}>Titular</Text>
            <TextInput
              placeholder="Nombre del titular"
              value={transfer.titular}
              returnKeyType="done"
              onChangeText={(v) => setTransfer(t => ({ ...t, titular: v }))}
              onSubmitEditing={() => Keyboard.dismiss()}
              style={[styles.input, transfer.titular.trim().length < 3 && styles.inputError]}
            />

            {!transferenciaValida && <Text style={styles.error}>Completa los datos de la transferencia.</Text>}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !puedeConfirmar && styles.btnDisabled]}
          disabled={!puedeConfirmar}
          onPress={onConfirm}
        >
          <Text style={styles.btnText}>Confirmar y registrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGhost} onPress={() => router.back()}>
          <Text style={styles.btnGhostText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MetodoButton({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.methodBtn, active && styles.methodBtnActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.methodText, active && styles.methodTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F8FAFC" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 16 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 6, textTransform: "uppercase" },
  sublabel: { fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 6 },
  total: { fontSize: 28, fontWeight: "900", color: "#1e40af" },
  row: { flexDirection: "row", gap: 8, marginTop: 6 },
  methodBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0",
    alignItems: "center", backgroundColor: "#F8FAFC",
  },
  methodBtnActive: { borderColor: "#1e40af", backgroundColor: "#DBEAFE" },
  methodText: { fontSize: 14, fontWeight: "700", color: "#334155" },
  methodTextActive: { color: "#1e40af" },
  input: {
    height: 50, borderWidth: 2, borderColor: "#E2E8F0", borderRadius: 10,
    paddingHorizontal: 12, backgroundColor: "#F8FAFC", fontSize: 16, color: "#0F172A",
  },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  inline: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  change: { fontSize: 18, fontWeight: "800", color: "#16a34a" },
  muted: { color: "#64748B" },
  error: { marginTop: 4, color: "#EF4444", fontWeight: "600" },
  footer: { marginTop: "auto", gap: 10, paddingVertical: 8 },
  btn: { height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#1e40af" },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  btnGhost: {
    height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: Platform.OS === "ios" ? "#F1F5F9" : "#E2E8F0",
  },
  btnGhostText: { color: "#475569", fontWeight: "700" },
});