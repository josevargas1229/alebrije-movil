import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchProductByQR, clearError } from "@/store/slices/productSlice";

const ProductDetailScreen = () => {
    const { qrcode } = useLocalSearchParams<{ qrcode: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { product, loading, error } = useSelector((state: RootState) => state.product);

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [availableStock, setAvailableStock] = useState<number | null>(null);

    useEffect(() => {
        if (qrcode) {
            dispatch(fetchProductByQR(qrcode));
        }
        return () => {
            dispatch(clearError());
        };
    }, [qrcode, dispatch]);

    useEffect(() => {
        if (product?.tallasColoresStock && product.tallasColoresStock.length > 0) {
            if (!selectedSize && !selectedColor) {
                const firstVariant = product.tallasColoresStock[0];
                setSelectedSize(firstVariant.talla.talla);
                setSelectedColor(firstVariant.coloresStock.color);
                setAvailableStock(firstVariant.stock);
            } else {
                const selectedVariant = product.tallasColoresStock.find(
                    (variant) =>
                        variant.talla.talla === selectedSize &&
                        variant.coloresStock.color === selectedColor
                );
                setAvailableStock(selectedVariant ? selectedVariant.stock : null);
            }
        }
    }, [product, selectedSize, selectedColor]);

    const handleRetry = () => {
        dispatch(clearError());
        if (qrcode) {
            dispatch(fetchProductByQR(qrcode));
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleAddToSale = () => {
        if (availableStock && availableStock > 0) {
            Alert.alert(
                "Producto agregado",
                `Se ha agregado ${selectedSize} - ${selectedColor} a la venta actual.`,
                [{ text: "OK", onPress: () => console.log("Agregado a venta actual") }]
            );
        } else {
            Alert.alert("Error", "No hay stock disponible.");
        }
    };

    const handleCreateNewSale = () => {
        if (availableStock && availableStock > 0) {
            Alert.alert(
                "Nueva venta creada",
                `Se ha creado una nueva venta con ${selectedSize} - ${selectedColor}.`,
                [{ text: "OK", onPress: () => console.log("Nueva venta creada") }]
            );
            // Placeholder: Integra con Redux/carrito para crear venta nueva.
        } else {
            Alert.alert("Error", "No hay stock disponible.");
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.message}>Cargando producto...</Text>
            </View>
        );
    }

    if (error) {
        return (
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
        );
    }

    if (!product) {
        return (
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
        );
    }

    const availableSizes = product.tallasColoresStock
        .filter((variant) => !selectedColor || variant.coloresStock.color === selectedColor)
        .map((variant) => variant.talla.talla);

    const availableColors = product.tallasColoresStock
        .filter((variant) => !selectedSize || variant.talla.talla === selectedSize)
        .map((variant) => variant.coloresStock.color);

    return (
        <View style={styles.container}>
            {product.tallasColoresStock[0]?.coloresStock?.imagenes[0]?.url && (
                <Image
                    source={{ uri: product.tallasColoresStock[0].coloresStock.imagenes[0].url }}
                    style={styles.productImage}
                    resizeMode="contain"
                />
            )}
            <Text style={styles.detail}>{product.tipo.nombre} {product.marca.nombre} {product.categoria.nombre}</Text>
            <Text style={styles.title}>${parseFloat(product.precio).toFixed(2)}</Text>
            <View style={styles.selectorContainer}>
                <Text style={styles.label}>Talla:</Text>
                <Picker
                    selectedValue={selectedSize}
                    onValueChange={(itemValue) => {
                        setSelectedSize(itemValue);
                        const selectedVariant = product.tallasColoresStock.find(
                            (variant) => variant.talla.talla === itemValue && variant.coloresStock.color === selectedColor
                        );
                        setAvailableStock(selectedVariant ? selectedVariant.stock : null);
                    }}
                    style={styles.picker}
                    enabled={availableSizes.length > 0}
                >
                    <Picker.Item label="Selecciona una talla" value={null} />
                    {availableSizes.map((size) => (
                        <Picker.Item key={size} label={size} value={size} />
                    ))}
                </Picker>
            </View>
            <View style={styles.selectorContainer}>
                <Text style={styles.label}>Color:</Text>
                <Picker
                    selectedValue={selectedColor}
                    onValueChange={(itemValue) => {
                        setSelectedColor(itemValue);
                        const selectedVariant = product.tallasColoresStock.find(
                            (variant) => variant.talla.talla === selectedSize && variant.coloresStock.color === itemValue
                        );
                        setAvailableStock(selectedVariant ? selectedVariant.stock : null);
                    }}
                    style={styles.picker}
                    enabled={availableColors.length > 0}
                >
                    <Picker.Item label="Selecciona un color" value={null} />
                    {availableColors.map((color) => (
                        <Picker.Item key={color} label={color} value={color} />
                    ))}
                </Picker>
            </View>
            {availableStock !== null && (
                <Text style={styles.stockText}>
                    Stock disponible: {availableStock}
                </Text>
            )}
            <TouchableOpacity
                style={[styles.button, !(selectedSize && selectedColor && availableStock && availableStock > 0) && styles.disabledButton]}
                onPress={handleAddToSale}
                disabled={!(selectedSize && selectedColor && availableStock && availableStock > 0)}
            >
                <Text style={styles.buttonText}>Agregar a la venta actual</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.buttonSecondary, !(selectedSize && selectedColor && availableStock && availableStock > 0) && styles.disabledButton]}
                onPress={handleCreateNewSale}
                disabled={!(selectedSize && selectedColor && availableStock && availableStock > 0)}
            >
                <Text style={styles.buttonTextSecondary}>Crear nueva venta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleGoBack}>
                <Text style={styles.buttonText}>Volver al escáner</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    productImage: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    detail: {
        fontSize: 16,
        marginBottom: 5,
    },
    selectorContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        width: "100%",
    },
    label: {
        fontSize: 16,
        marginRight: 10,
    },
    picker: {
        flex: 1,
        height: 50,
    },
    stockText: {
        fontSize: 16,
        color: "green",
        marginBottom: 10,
    },
    button: {
        backgroundColor: "#3b82f6",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 12,
        width: "80%",
        alignItems: "center",
    },
    buttonSecondary: {
        backgroundColor: "#f97316",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 12,
        width: "80%",
        alignItems: "center",
    },
    disabledButton: {
        backgroundColor: "#cccccc",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    buttonTextSecondary: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        backgroundColor: "#f8fafc",
    },
    errorIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#eff6ff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        borderWidth: 3,
        borderColor: "#3b82f6",
    },
    errorIcon: {
        fontSize: 48,
    },
    errorTitle: {
        fontSize: 24,
        color: "#1e293b",
        marginBottom: 12,
        textAlign: "center",
        fontWeight: "700",
    },
    errorMessage: {
        fontSize: 16,
        color: "#64748b",
        marginBottom: 32,
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 20,
        color: "#3b82f6",
        marginBottom: 24,
        textAlign: "center",
        fontWeight: "500",
    },
    errorButton: {
        backgroundColor: "#f97316",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginBottom: 12,
        width: "80%",
        alignItems: "center",
        shadowColor: "#f97316",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    errorButtonSecondary: {
        backgroundColor: "#fff",
        borderColor: "#3b82f6",
        borderWidth: 2,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: "80%",
        alignItems: "center",
    },
    errorButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    errorButtonTextSecondary: {
        color: "#3b82f6", 
        fontSize: 16,
        fontWeight: "700",
    },
    message: {
        fontSize: 18,
        marginTop: 10,
    },
});

export default ProductDetailScreen;