import { View, Text } from "react-native";
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetailScreen() {
    const { barcode } = useLocalSearchParams();
    console.log("ProductDetailScreen rendered with barcode:", barcode);
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>ProductDetail Screen</Text>
        </View>
    );
}