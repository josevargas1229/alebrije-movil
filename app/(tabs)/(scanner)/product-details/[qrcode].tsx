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
            // Inicializar con la primera talla y color disponibles si no hay selección
            if (!selectedSize && !selectedColor) {
                const firstVariant = product.tallasColoresStock[0];
                setSelectedSize(firstVariant.talla.talla);
                setSelectedColor(firstVariant.coloresStock.color);
                setAvailableStock(firstVariant.stock);
            } else {
                // Actualizar stock cuando cambie la selección
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
                `Se ha agregado ${selectedSize} - ${selectedColor} al carrito.`,
                [{ text: "OK", onPress: () => console.log("Producto agregado") }]
            );
        } else {
            Alert.alert("Error", "No hay stock disponible para esta combinación.");
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.message}>Cargando producto...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.button} onPress={handleRetry}>
                    <Text style={styles.buttonText}>Reintentar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleGoBack}>
                    <Text style={styles.buttonText}>Volver al escáner</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Producto no encontrado</Text>
                <TouchableOpacity style={styles.button} onPress={handleGoBack}>
                    <Text style={styles.buttonText}>Volver al escáner</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Filtrar tallas disponibles según el color seleccionado
    const availableSizes = product.tallasColoresStock
        .filter((variant) => !selectedColor || variant.coloresStock.color === selectedColor)
        .map((variant) => variant.talla.talla);

    // Filtrar colores disponibles según la talla seleccionada
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
            <Text style={styles.title}>Precio: ${parseFloat(product.precio).toFixed(2)}</Text>
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
                <Text style={styles.buttonText}>Agregar a la venta</Text>
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
        backgroundColor: "#007AFF",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 10,
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
    errorText: {
        fontSize: 18,
        color: "red",
        marginBottom: 20,
        textAlign: "center",
    },
    message: {
        fontSize: 18,
        marginTop: 10,
    },
});

export default ProductDetailScreen;