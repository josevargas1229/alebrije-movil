import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchProductByQR, clearError, clearProduct } from "@/store/slices/productSlice";
import {
  startNewOrder,
  addProducto,
  updateProducto,
  VentaProducto,
} from "@/store/slices/salesSlice";
import { useFocusEffect } from "@react-navigation/native";

/* ===== Tipos locales ===== */
type Imagen = { url: string };
type Talla = { id?: string | number; talla: string };
type ColorStock = { id?: string | number; color: string; imagenes?: Imagen[] };
type Variant = { talla?: Talla; coloresStock?: ColorStock; stock?: number | null };

type ProductLike = {
  id: string | number;
  precio: number | string;
  tipo?: { nombre?: string };
  marca?: { nombre?: string };
  categoria?: { nombre?: string };
  tallasColoresStock: Variant[];
};

const findVariant = (
  p: ProductLike | null | undefined,
  size: string | null,
  color: string | null
): Variant | undefined =>
  p?.tallasColoresStock?.find(
    (x) => x?.talla?.talla === size && x?.coloresStock?.color === color
  );

/* ===== Util ===== */
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const ProductDetailScreen = () => {
  const { qrcode } = useLocalSearchParams<{ qrcode: string }>();
  const dispatch = useDispatch() as AppDispatch;
  const router = useRouter();
  const { product, loading, error } = useSelector((s: RootState) => s.product) as {
    product: ProductLike | null;
    loading: boolean;
    error: string | null;
  };
  const { drafts, activeSaleId } = useSelector((s: RootState) => s.sales);
  const activeDraft = activeSaleId ? drafts[activeSaleId] : null;
  const [justCreated, setJustCreated] = useState(false);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [qty, setQty] = useState<number>(1);

  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    dispatch(clearProduct());
    setSelectedSize(null);
    setSelectedColor(null);
    setAvailableStock(null);
    setQty(1);
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(clearProduct());
      setSelectedSize(null);
      setSelectedColor(null);
      setAvailableStock(null);
      setQty(1);
      dispatch(clearError());
    }, [dispatch])
  );

  useEffect(() => {
    dispatch(clearProduct());
    if (qrcode) dispatch(fetchProductByQR(qrcode));
    return () => {
      dispatch(clearError());
    };
  }, [qrcode, dispatch]);

  // Asegura venta activa
  useEffect(() => {
    if (!activeDraft && !activeSaleId) dispatch(startNewOrder());
  }, [activeDraft, activeSaleId, dispatch]);

  useEffect(() => {
    if (product?.tallasColoresStock?.length) {
      if (!selectedSize && !selectedColor) {
        const first = product.tallasColoresStock[0];
        setSelectedSize(first?.talla?.talla ?? null);
        setSelectedColor(first?.coloresStock?.color ?? null);
        setAvailableStock(first?.stock ?? null);
      } else {
        const v = findVariant(product, selectedSize, selectedColor);
        setAvailableStock(v ? v.stock ?? null : null);
      }
    }
  }, [product, selectedSize, selectedColor]);

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(clearProduct());
    if (qrcode) dispatch(fetchProductByQR(qrcode));
  };

  const handleGoBack = () => {
    setSelectedSize(null);
    setSelectedColor(null);
    setAvailableStock(null);
    setQty(1);
    router.back();
  };

  const variant = useMemo(
    () => (product && selectedSize && selectedColor ? findVariant(product, selectedSize, selectedColor) ?? null : null),
    [product, selectedSize, selectedColor]
  );

  const talla_id = variant?.talla?.id ?? (variant as any)?.talla_id ?? null;
  const color_id = variant?.coloresStock?.id ?? (variant as any)?.color_id ?? null;
  const precioUnit = product ? Number(product.precio) : 0;

  const ensureValidQty = (n: number) => {
    const max = availableStock ?? 0;
    setQty(clamp(n, 1, Math.max(1, max)));
  };

  const producto_nombre = [product?.tipo?.nombre, product?.marca?.nombre, product?.categoria?.nombre]
    .filter(Boolean)
    .join(" ");

  const handleAddToSale = () => {
    if (!activeSaleId) {
      dispatch(startNewOrder());
      return Alert.alert("Creando venta", "Se creó una venta nueva.");
    }
    if (!product || !variant || !talla_id || !color_id) {
      Alert.alert("Faltan variaciones", "Selecciona talla y color.");
      return;
    }
    if (!availableStock || availableStock <= 0) {
      Alert.alert("Error", "No hay stock disponible.");
      return;
    }
    if (qty > availableStock) {
      Alert.alert("Stock insuficiente", `Disponible: ${availableStock}. Ajusta la cantidad.`);
      return;
    }

    const talla_label = selectedSize ?? "";
    const color_label = selectedColor ?? "";

    const existingIndex = (activeDraft?.productos || []).findIndex(
      (p: VentaProducto) => p.producto_id === Number(product.id) && p.talla_id === talla_id && p.color_id === color_id
    );

    if (existingIndex >= 0 && activeDraft) {
      const currentQty = activeDraft.productos[existingIndex].cantidad;
      const nextQty = currentQty + qty;
      if (nextQty > (availableStock ?? 0)) {
        Alert.alert("Stock insuficiente", `Ya tienes ${currentQty}. Máximo: ${availableStock}.`);
        return;
      }
      dispatch(
        updateProducto({
          id: activeSaleId,
          index: existingIndex,
          patch: {
            cantidad: nextQty,
            precio_unitario: precioUnit,
            ...({ talla_label, color_label } as any),
          },
        })
      );
    } else {
      dispatch(
        addProducto({
          id: activeSaleId,
          producto: {
            producto_id: Number(product.id),
            talla_id,
            color_id,
            cantidad: qty,
            precio_unitario: precioUnit,
            ...({ talla_label, color_label } as any),
            producto_nombre,
          },
        })
      );
    }

    Alert.alert(
      "Producto agregado",
      `Se agregó ${talla_label} - ${color_label} (x${qty}) a la venta actual.`,
      [{ text: "OK", onPress: () => router.push(`/(sales)/${activeSaleId}`) }]
    );
  };

  const handleCreateNewSale = () => {
    if (!availableStock || availableStock <= 0) {
      Alert.alert("Error", "No hay stock disponible.");
      return;
    }
    if (!product || !variant || !talla_id || !color_id) {
      Alert.alert("Faltan variaciones", "Selecciona talla y color.");
      return;
    }
    setJustCreated(true);
    dispatch(startNewOrder());
    Alert.alert("Nueva venta creada", "Redirigiendo a la nueva venta...", [
      { text: "OK", onPress: () => router.push(`/(sales)/${activeSaleId || ""}`) },
    ]);
  };

  useEffect(() => {
    if (justCreated && activeSaleId && product && variant && talla_id && color_id) {
      const cantidad = Math.min(qty, availableStock || 0);
      dispatch(
        addProducto({
          id: activeSaleId,
          producto: {
            producto_id: Number(product.id),
            talla_id,
            color_id,
            cantidad,
            precio_unitario: precioUnit,
          },
        })
      );
      setJustCreated(false);
    }
  }, [justCreated, activeSaleId, product, variant, talla_id, color_id, qty, availableStock, dispatch, precioUnit]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando producto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>Algo salió mal</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleRetry}>
            <Text style={styles.errorButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.errorButtonSecondary} onPress={handleGoBack}>
            <Text style={styles.errorButtonTextSecondary}>Volver al escáner</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>🔍</Text>
          </View>
          <Text style={styles.errorTitle}>Producto no encontrado</Text>
          <Text style={styles.errorMessage}>No pudimos encontrar información para este código QR</Text>
          <TouchableOpacity style={styles.errorButtonSecondary} onPress={handleGoBack}>
            <Text style={styles.errorButtonTextSecondary}>Volver al escáner</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const availableSizes: string[] = product.tallasColoresStock
    .filter((v) => !selectedColor || v?.coloresStock?.color === selectedColor)
    .map((v) => v?.talla?.talla as string)
    .filter((x, i, arr) => arr.indexOf(x) === i);

  const availableColors: string[] = product.tallasColoresStock
    .filter((v) => !selectedSize || v?.talla?.talla === selectedSize)
    .map((v) => v?.coloresStock?.color as string)
    .filter((x, i, arr) => arr.indexOf(x) === i);

  const openSizePicker = () => {
    if (!selectedSize && availableSizes.length) {
      const next = availableSizes[0];
      setSelectedSize(next);
      const v = findVariant(product, next, selectedColor);
      setAvailableStock(v ? v.stock ?? null : null);
      ensureValidQty(qty);
    }
    setShowSizePicker(true);
  };

  const openColorPicker = () => {
    if (!selectedColor && availableColors.length) {
      const next = availableColors[0];
      setSelectedColor(next);
      const v = findVariant(product, selectedSize, next);
      setAvailableStock(v ? v.stock ?? null : null);
      ensureValidQty(qty);
    }
    setShowColorPicker(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {product.tallasColoresStock[0]?.coloresStock?.imagenes?.[0]?.url && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.tallasColoresStock[0].coloresStock.imagenes![0].url }}
              style={styles.productImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.productDescription}>
            {product.tipo?.nombre} {product.marca?.nombre} {product.categoria?.nombre}
          </Text>
          <Text style={styles.productPrice}>${parseFloat(String(product.precio)).toFixed(2)}</Text>
        </View>

        <View style={styles.selectorsSection}>
          <View style={styles.selectorWrapper}>
            <Text style={styles.selectorLabel}>Talla</Text>
            <TouchableOpacity style={styles.field} onPress={openSizePicker}>
              <Text style={styles.fieldText}>{selectedSize ?? "Selecciona una talla"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.selectorWrapper}>
            <Text style={styles.selectorLabel}>Color</Text>
            <TouchableOpacity style={styles.field} onPress={openColorPicker}>
              <Text style={styles.fieldText}>{selectedColor ?? "Selecciona un color"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.selectorLabel}>Cantidad</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, qty <= 1 && styles.quantityButtonDisabled]}
                onPress={() => ensureValidQty(qty - 1)}
                disabled={qty <= 1}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{qty}</Text>
              <TouchableOpacity
                style={[styles.quantityButton, availableStock && qty >= availableStock ? styles.quantityButtonDisabled : undefined]}
                onPress={() => ensureValidQty(qty + 1)}
                disabled={!availableStock || qty >= (availableStock ?? 0)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {availableStock !== null && (
            <View style={styles.stockContainer}>
              <Text style={styles.stockText}>
                Stock disponible: <Text style={styles.stockNumber}>{availableStock}</Text>
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !(selectedSize && selectedColor && availableStock && availableStock > 0) && styles.disabledButton,
            ]}
            onPress={handleAddToSale}
            disabled={!(selectedSize && selectedColor && availableStock && availableStock > 0)}
          >
            <Text style={styles.primaryButtonText}>Agregar a la venta actual</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              !(selectedSize && selectedColor && availableStock && availableStock > 0) && styles.disabledButton,
            ]}
            onPress={handleCreateNewSale}
            disabled={!(selectedSize && selectedColor && availableStock && availableStock > 0)}
          >
            <Text style={styles.secondaryButtonText}>Crear nueva venta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              !(selectedSize && selectedColor && availableStock && availableStock > 0) && styles.disabledButton,
            ]}
            onPress={() => {
              if (!(selectedSize && selectedColor && availableStock && availableStock > 0)) return;
              const productToAdd = {
                producto_id: Number(product.id),
                talla_id,
                color_id,
                cantidad: qty,
                precio_unitario: precioUnit,
                talla_label: selectedSize ?? "",
                color_label: selectedColor ?? "",
                producto_nombre,
              };
              router.push({ pathname: "/(tabs)/(sales)", params: { addProduct: JSON.stringify(productToAdd) } });
            }}
            disabled={!(selectedSize && selectedColor && availableStock && availableStock > 0)}
          >
            <Text style={styles.secondaryButtonText}>Elegir venta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButton} onPress={handleGoBack}>
            <Text style={styles.outlineButtonText}>Volver al escáner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Talla */}
      <Modal visible={showSizePicker} transparent animationType="slide" onRequestClose={() => setShowSizePicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Selecciona talla</Text>
            <Picker
              selectedValue={selectedSize}
              onValueChange={(val: string | null) => {
                setSelectedSize(val);
                const v = findVariant(product, val, selectedColor);
                setAvailableStock(v ? v.stock ?? null : null);
                ensureValidQty(qty);
              }}
              style={[styles.modalPicker, { color: "#0f172a" }]}
              mode={Platform.OS === "android" ? "dialog" : undefined}
              dropdownIconColor="#0f172a"
              dropdownIconRippleColor="#0f172a"
              itemStyle={styles.pickerItemIOS as any}
            >
              <Picker.Item label="Selecciona una talla" value={null} />
              {availableSizes.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowSizePicker(false)}>
              <Text style={styles.modalCloseText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Color */}
      <Modal visible={showColorPicker} transparent animationType="slide" onRequestClose={() => setShowColorPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Selecciona color</Text>
            <Picker
              selectedValue={selectedColor}
              onValueChange={(val: string | null) => {
                setSelectedColor(val);
                const v = findVariant(product, selectedSize, val);
                setAvailableStock(v ? v.stock ?? null : null);
                ensureValidQty(qty);
              }}
              style={[styles.modalPicker, { color: "#0f172a" }]}
              mode={Platform.OS === "android" ? "dialog" : undefined}
              dropdownIconColor="#0f172a"
              itemStyle={styles.pickerItemIOS as any}
            >
              <Picker.Item label="Selecciona un color" value={null} />
              {availableColors.map((c) => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowColorPicker(false)}>
              <Text style={styles.modalCloseText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingText: {
    fontSize: 16,
    marginTop: 16,
    color: "#64748b",
    fontWeight: "500",
  },

  imageContainer: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: { width: 260, height: 260 },

  infoSection: {
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  productDescription: {
    fontSize: 17,
    color: "#64748b",
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 24,
  },
  productPrice: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  selectorsSection: { marginBottom: 28 },
  selectorWrapper: { marginBottom: 20 },
  selectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 10,
  },

  field: {
    height: 52,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  fieldText: { color: "#0f172a", fontSize: 16, fontWeight: "600" },

  quantitySection: { marginBottom: 20 },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 10,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  quantityButtonDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityButtonText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 28,
  },
  quantityText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    minWidth: 40,
    textAlign: "center",
  },

  stockContainer: {
    backgroundColor: "#f0fdf4",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  stockText: {
    fontSize: 15,
    color: "#166534",
    textAlign: "center",
    fontWeight: "500",
  },
  stockNumber: { fontWeight: "800", fontSize: 16 },

  actionsSection: { gap: 14, marginTop: 8 },
  primaryButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#f97316",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  secondaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  outlineButton: {
    backgroundColor: "#ffffff",
    borderColor: "#3b82f6",
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
  },
  outlineButtonText: { color: "#3b82f6", fontSize: 16, fontWeight: "700" },
  disabledButton: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },
  modalPicker: { height: Platform.OS === "ios" ? 200 : 50, color: "#0f172a" },
  pickerItemIOS: { color: "#0f172a", fontSize: 18, fontWeight: "600" },
  modalClose: {
    marginTop: 8,
    alignSelf: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCloseText: { color: "#fff", fontWeight: "700" },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f8fafc",
  },
  errorIconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 3,
    borderColor: "#3b82f6",
  },
  errorIcon: { fontSize: 52 },
  errorTitle: {
    fontSize: 26,
    color: "#0f172a",
    marginBottom: 14,
    textAlign: "center",
    fontWeight: "800",
  },
  errorMessage: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 36,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  errorButton: {
    backgroundColor: "#f97316",
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 14,
    marginBottom: 14,
    width: "85%",
    alignItems: "center",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  errorButtonSecondary: {
    backgroundColor: "#ffffff",
    borderColor: "#3b82f6",
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 14,
    width: "85%",
    alignItems: "center",
  },
  errorButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  errorButtonTextSecondary: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ProductDetailScreen;
