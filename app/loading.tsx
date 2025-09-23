import { View, Animated, StyleSheet, Easing } from "react-native";
import { router, usePathname } from "expo-router";
import { useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { checkAuth } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/hooks/use-app-dispatch";
import { LinearGradient } from "expo-linear-gradient";

const BouncingDots = () => {
    const dotScales = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

    useEffect(() => {
        const createAnimation = (anim: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 500,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        dotScales.forEach((dot, i) => createAnimation(dot, i * 200).start());

        return () => dotScales.forEach((dot) => dot.stopAnimation());
    }, []);

    return (
        <View style={styles.dotsContainer}>
            {dotScales.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            transform: [
                                {
                                    scale: anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.6, 1.3],
                                    }),
                                },
                            ],
                            opacity: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.4, 1],
                            }),
                        },
                    ]}
                />
            ))}
        </View>
    );
};

export default function LoadingScreen() {
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const { user, hasCheckedAuth } = useSelector((state: any) => state.auth);
    const [redirectAttempted, setRedirectAttempted] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        if (!hasCheckedAuth) {
            dispatch(checkAuth());
        }
    }, [dispatch, hasCheckedAuth]);

    useEffect(() => {
        if (hasCheckedAuth && !redirectAttempted) {
            const timer = setTimeout(() => {
                if (user && pathname !== "/(tabs)") {
                    setRedirectAttempted("/(tabs)");
                    router.push("/(tabs)");
                } else if (!user && pathname !== "/login") {
                    setRedirectAttempted("/login");
                    router.push("/login");
                }
            }, 1200);

            return () => clearTimeout(timer);
        }
    }, [hasCheckedAuth, user, pathname, redirectAttempted]);

    return (
        <LinearGradient
            colors={["#1e3a8a", "#2563eb", "#60a5fa"]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Halo detrás del logo */}
                <View style={styles.logoHalo} />

                {/* Logo principal */}
                <View style={styles.logoCircle}>
                    <View style={styles.alebrijeText} />
                </View>

                {/* Indicador con puntos animados */}
                <BouncingDots />
            </Animated.View>

            {/* Elementos decorativos suaves */}
            <View style={styles.decorativeElements}>
                <View style={[styles.floatingElement, styles.element1]} />
                <View style={[styles.floatingElement, styles.element2]} />
                <View style={[styles.floatingElement, styles.element3]} />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1e3a8a",
    },
    content: {
        alignItems: "center",
        zIndex: 2,
    },
    logoHalo: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "#f97316",
        opacity: 0.2
    },
    logoCircle: {
        width: 120,
        height: 120,
        backgroundColor: "#fff",
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
        shadowColor: "#f97316",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        marginBottom: 40,
    },
    alebrijeText: {
        width: "70%",
        height: 20,
        backgroundColor: "#3b82f6",
        borderRadius: 10,
    },
    dotsContainer: {
        flexDirection: "row",
        gap: 10,
        marginTop: 20,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#f97316",
    },
    decorativeElements: {
        position: "absolute",
        width: "100%",
        height: "100%",
        zIndex: 0,
    },
    floatingElement: {
        position: "absolute",
        backgroundColor: "#f97316",
        borderRadius: 100,
        opacity: 0.08,
    },
    element1: {
        width: 120,
        height: 120,
        top: "15%",
        right: "10%",
    },
    element2: {
        width: 80,
        height: 80,
        bottom: "20%",
        left: "15%",
    },
    element3: {
        width: 150,
        height: 150,
        top: "60%",
        left: "65%",
    },
});
