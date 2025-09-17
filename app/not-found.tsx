//página de no encontrado
// app/+not-found.tsx
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function NotFoundScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>404</Text>
            <Text style={styles.message}>Página no encontrada</Text>
            <Button title="Ir al inicio" onPress={() => router.replace("/")} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: "bold",
        marginBottom: 10,
    },
    message: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: "center",
    },
});
