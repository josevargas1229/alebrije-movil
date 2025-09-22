import { Stack } from 'expo-router';

export default function ScannerLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
            }}
        >
            <Stack.Screen
                name="scanner"
                options={{ title: 'Escanea un código' }}
            />
            <Stack.Screen
                name="product-details/[barcode]"
                options={{
                    title: 'Detalles del producto',
                    animation: 'fade_from_bottom',
                }}
            />
        </Stack>
    );
}