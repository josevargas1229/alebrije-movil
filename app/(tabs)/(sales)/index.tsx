import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { startNewOrder, setActiveSale, clearDraft, DRAFT_STATUS_LABELS, DraftSale, addProducto } from "@/store/slices/salesSlice";
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SalesListScreen() {
    const dispatch = useDispatch();
    const { drafts, activeSaleId } = useSelector((state: RootState) => state.sales);
    const activeDrafts = Object.values(drafts).filter(d => d.status === "en_proceso");
    const completedDrafts = Object.values(drafts).filter(d => d.status !== "en_proceso");
    const router = useRouter();
    const params = useLocalSearchParams<{ addProduct?: string }>();
    const navigation = useNavigation<any>();
    const productToAdd = params.addProduct ? JSON.parse(params.addProduct) : null;

    const handleSelectSale = (saleId: string) => {
        dispatch(setActiveSale(saleId));
        if (productToAdd) {
            dispatch(addProducto({ id: saleId, producto: productToAdd }));
            Alert.alert("Agregado", "Producto añadido a la venta seleccionada.");
            navigation.setParams( { addProduct: undefined } );
        }
        router.push(`/(sales)/${saleId}`);
    };

    const handleNewSale = () => {
        dispatch(startNewOrder());
        if (productToAdd && activeSaleId) {
            dispatch(addProducto({ id: activeSaleId, producto: productToAdd }));
            Alert.alert("Agregado", "Producto añadido a la nueva venta.");
            router.push(`/(sales)/${activeSaleId}`);
            navigation.setParams( { addProduct: undefined } );
        }
    };
    const handleDeleteSale = (saleId: string) => {
        Alert.alert(
            "Eliminar Venta",
            "¿Eliminar esta venta del caché?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => dispatch(clearDraft(saleId)),
                },
            ]
        );
    };

    const renderSwipeableItem = (sale: DraftSale) => (
        <Swipeable
            renderRightActions={() => (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteSale(sale.id)}
                >
                    <IconSymbol name="trash.fill" color="#fff" size={24} />

                </TouchableOpacity>
            )}
            onSwipeableOpen={() => handleDeleteSale(sale.id)}
            rightThreshold={55}
            overshootRight={false}
        >
            <TouchableOpacity
                style={[styles.item, activeSaleId === sale.id && styles.activeItem]}
                onPress={() => handleSelectSale(sale.id)}
            >
                <View style={styles.itemContent}>
                    <Text style={styles.orderText}>{sale.orderNumber}</Text>
                    <Text style={styles.totalText}>${sale.total.toFixed(2)} MXN</Text>
                </View>
                <View style={styles.itemRight}>
                    <Text style={styles.status}>{DRAFT_STATUS_LABELS[sale.status]}</Text>
                    {activeSaleId === sale.id && <Text style={styles.activeIndicator}>Activa</Text>}
                </View>
            </TouchableOpacity>
        </Swipeable>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.addButton} onPress={handleNewSale}>
                <Text style={styles.addText}>+ Nueva Venta</Text>
            </TouchableOpacity>

            <ScrollView style={styles.scrollView}>
                {activeDrafts.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Activas/Pendientes</Text>
                        {activeDrafts.map((sale) => (
                            <View key={sale.id} style={styles.swipeContainer}>
                                {renderSwipeableItem(sale)}
                            </View>
                        ))}
                    </>
                )}

                {completedDrafts.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Completadas</Text>
                        {completedDrafts.map((sale) => (
                            <View key={sale.id} style={styles.swipeContainer}>
                                {renderSwipeableItem(sale)}
                            </View>
                        ))}
                    </>
                )}

                {activeDrafts.length === 0 && completedDrafts.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No hay ventas</Text>
                        <Text style={styles.emptySubtext}>Crea tu primera venta</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F1F5F9"
    },
    addButton: {
        backgroundColor: "#1e40af",
        padding: 16,
        borderRadius: 12,
        margin: 20,
        marginBottom: 8
    },
    addText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 16
    },
    scrollView: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        color: "#1e293b"
    },
    swipeContainer: {
        marginHorizontal: 20,
        marginBottom: 8,
    },
    item: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 60,
    },
    activeItem: {
        borderColor: "#1e40af",
        borderWidth: 2
    },
    itemContent: {
        flex: 1,
    },
    orderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0f172a",
        marginBottom: 2,
    },
    totalText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1e40af",
    },
    itemRight: {
        alignItems: "flex-end",
        gap: 4,
    },
    status: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500"
    },
    activeIndicator: {
        fontSize: 12,
        color: "#10b981",
        fontWeight: "bold"
    },
    deleteButton: {
        backgroundColor: "#ef4444",
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        borderRadius: 12,
        marginVertical: 2,
    },

    deleteIcon: {
        fontSize: 20,
        color: "#fff",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#64748b",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#94a3b8",
    },
});