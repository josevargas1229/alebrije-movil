import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ScannerScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [facing, setFacing] = useState<CameraType>('back');
    const [cameraReady, setCameraReady] = useState(false);
    const router = useRouter();
    const cameraRef = useRef<CameraView>(null);

    // Calcular el tamaño del área de escaneo cuadrada
    const scanAreaSize = Math.min(screenWidth * 0.7, screenHeight * 0.4);

    // Solicitar permisos de la cámara al cargar la pantalla
    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    // Manejar cuando la cámara está lista
    const handleCameraReady = () => {
        setCameraReady(true);
    };

    // Manejar el escaneo del código QR/Barcode
    const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (!cameraReady) return; // Solo procesar si la cámara está lista
        
        setScanned(true);
        
        // Verificar si es un código QR
        if (type === 'qr') {
            // Navegar usando ruta relativa con parámetros dinámicos
            router.push({
                pathname: '/product-details/[barcode]',
                params: { barcode: data },
            });
        } else {
            // Manejar otros tipos de códigos de barras
            Alert.alert(
                'Código detectado', 
                `Tipo: ${type}\nDatos: ${data}`,
                [
                    {
                        text: 'Usar este código',
                        onPress: () => {
                            router.push({
                                pathname: '/product-details/[barcode]',
                                params: { barcode: data },
                            });
                        }
                    },
                    {
                        text: 'Solo códigos QR',
                        onPress: () => setScanned(false),
                        style: 'cancel'
                    }
                ]
            );
        }
    };

    // Función para volver a escanear
    const resetScanner = () => {
        setScanned(false);
    };

    // Función para cambiar entre cámara frontal y trasera
    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // Manejo de estados de permisos
    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Cargando permisos de cámara...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    Necesitamos permiso para usar la cámara
                </Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Conceder permiso</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                onCameraReady={handleCameraReady}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'], // Solo códigos QR como en tu código original
                }}
                // Configuraciones adicionales recomendadas
                enableTorch={false}
                autofocus="on"
            />
            
            {/* Overlay con información y controles */}
            <View style={styles.overlay}>
                {/* Área superior con botón de flip */}
                <View style={styles.topOverlay}>
                    <TouchableOpacity 
                        style={styles.flipButton} 
                        onPress={toggleCameraFacing}
                        disabled={!cameraReady}
                    >
                        <Text style={styles.flipButtonText}>🔄</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Área central con marco de escaneo cuadrado */}
                <View style={styles.centerOverlay}>
                    <View style={styles.scanAreaContainer}>
                        <View 
                            style={[
                                styles.scanArea,
                                {
                                    width: scanAreaSize,
                                    height: scanAreaSize,
                                }
                            ]}
                        >
                            <View style={styles.scanFrame} />
                            {/* Esquinas del marco */}
                            <View style={[styles.corner, styles.topLeftCorner]} />
                            <View style={[styles.corner, styles.topRightCorner]} />
                            <View style={[styles.corner, styles.bottomLeftCorner]} />
                            <View style={[styles.corner, styles.bottomRightCorner]} />
                        </View>
                    </View>
                </View>
                
                {/* Área inferior con instrucciones y botones */}
                <View style={styles.bottomOverlay}>
                    <Text style={styles.instructions}>
                        {!cameraReady 
                            ? 'Iniciando cámara...'
                            : scanned 
                                ? '¡Código QR escaneado!' 
                                : 'Apunta la cámara a un código QR'
                        }
                    </Text>
                    {scanned && (
                        <TouchableOpacity style={styles.button} onPress={resetScanner}>
                            <Text style={styles.buttonText}>Escanear otro código</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: '#fff',
        fontSize: 16,
        marginHorizontal: 20,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
    topOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        paddingTop: 60,
        paddingRight: 20,
    },
    centerOverlay: {
        flex: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanAreaContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    scanFrame: {
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#00ff00',
        borderWidth: 4,
    },
    topLeftCorner: {
        top: -2,
        left: -2,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 12,
    },
    topRightCorner: {
        top: -2,
        right: -2,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 12,
    },
    bottomLeftCorner: {
        bottom: -2,
        left: -2,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 12,
    },
    bottomRightCorner: {
        bottom: -2,
        right: -2,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 12,
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    instructions: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
        color: '#fff',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 10,
        minWidth: 200,
        alignItems: 'center',
    },
    flipButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 12,
        borderRadius: 25,
        minWidth: 50,
        alignItems: 'center',
    },
    flipButtonText: {
        fontSize: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});