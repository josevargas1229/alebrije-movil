import { View, Animated, StyleSheet, Easing, Dimensions, Image } from "react-native"
import { router, usePathname } from "expo-router"
import { useSelector } from "react-redux"
import { useEffect, useState, useRef, useMemo } from "react"
import { checkAuth } from "@/store/slices/authSlice"
import { useAppDispatch } from "@/hooks/use-app-dispatch"
import { LinearGradient } from "expo-linear-gradient"

const { width, height } = Dimensions.get("window")

// Componente de ondas de energía animadas
const EnergyWaves = () => {
    const wave1 = useRef(new Animated.Value(0)).current
    const wave2 = useRef(new Animated.Value(0)).current
    const wave3 = useRef(new Animated.Value(0)).current

    const createWaveAnimation = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        )
    }

    useEffect(() => {
        createWaveAnimation(wave1, 0).start()
        createWaveAnimation(wave2, 1000).start()
        createWaveAnimation(wave3, 2000).start()

        return () => {
            wave1.stopAnimation()
            wave2.stopAnimation()
            wave3.stopAnimation()
        }
    }, [])

    const createWaveStyle = (anim: Animated.Value, size: number) => ({
        position: "absolute" as const,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: "#f97316",
        transform: [
            {
                scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 2.5],
                }),
            },
        ],
        opacity: anim.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [0.8, 0.3, 0],
        }),
    })

    return (
        <View style={styles.wavesContainer}>
            <Animated.View style={createWaveStyle(wave1, 200)} />
            <Animated.View style={createWaveStyle(wave2, 160)} />
            <Animated.View style={createWaveStyle(wave3, 120)} />
        </View>
    )
}

const FloatingParticles = () => {
    // Move all useRef calls to top level
    const particle1 = {
        translateY: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0)).current,
    }
    const particle2 = {
        translateY: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0)).current,
    }
    const particle3 = {
        translateY: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0)).current,
    }
    const particle4 = {
        translateY: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0)).current,
    }
    const particle5 = {
        translateY: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0)).current,
    }
    const particle6 = {
        translateY: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0)).current,
    }
    const particle7 = {
        translateY: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0)).current,
    }
    const particle8 = {
        translateY: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0)).current,
    }

    const particles = useMemo(
        () => [particle1, particle2, particle3, particle4, particle5, particle6, particle7, particle8],
        [],
    )

    const animateParticle = (particle: any, index: number) => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(index * 400),
                Animated.parallel([
                    Animated.timing(particle.opacity, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(particle.scale, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(particle.translateY, {
                        toValue: -100,
                        duration: 4000,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(particle.translateX, {
                        toValue: (Math.random() - 0.5) * 100,
                        duration: 4000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(particle.opacity, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(particle.scale, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        ).start(() => {
            // Reset values for next loop
            particle.translateY.setValue(0)
            particle.translateX.setValue(0)
            particle.opacity.setValue(0)
            particle.scale.setValue(0)
        })
    }

    useEffect(() => {
        particles.forEach((particle, index) => {
            animateParticle(particle, index)
        })

        return () => {
            particles.forEach((particle) => {
                particle.translateY.stopAnimation()
                particle.translateX.stopAnimation()
                particle.opacity.stopAnimation()
                particle.scale.stopAnimation()
            })
        }
    }, [particles])

    return (
        <View style={styles.particlesContainer}>
            {particles.map((particle, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.particle,
                        {
                            left: Math.random() * width,
                            top: height * 0.7 + Math.random() * 100,
                            transform: [
                                { translateY: particle.translateY },
                                { translateX: particle.translateX },
                                { scale: particle.scale },
                            ],
                            opacity: particle.opacity,
                        },
                    ]}
                />
            ))}
        </View>
    )
}

// Indicador de carga mejorado
const PulsingDots = () => {
    const dot1Scale = useRef(new Animated.Value(0.6)).current
    const dot1Opacity = useRef(new Animated.Value(0.4)).current
    const dot2Scale = useRef(new Animated.Value(0.6)).current
    const dot2Opacity = useRef(new Animated.Value(0.4)).current
    const dot3Scale = useRef(new Animated.Value(0.6)).current
    const dot3Opacity = useRef(new Animated.Value(0.4)).current

    const dots = useMemo(
        () => [
            { scale: dot1Scale, opacity: dot1Opacity },
            { scale: dot2Scale, opacity: dot2Opacity },
            { scale: dot3Scale, opacity: dot3Opacity },
        ],
        [],
    )

    const animateDot = (dot: any, index: number) => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(index * 200),
                Animated.parallel([
                    Animated.timing(dot.scale, {
                        toValue: 1.4,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot.opacity, {
                        toValue: 1,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(dot.scale, {
                        toValue: 0.6,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot.opacity, {
                        toValue: 0.4,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        ).start()
    }

    useEffect(() => {
        dots.forEach((dot, index) => {
            animateDot(dot, index)
        })

        return () => {
            dots.forEach((dot) => {
                dot.scale.stopAnimation()
                dot.opacity.stopAnimation()
            })
        }
    }, [dots])

    return (
        <View style={styles.dotsContainer}>
            {dots.map((dot, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.modernDot,
                        {
                            transform: [{ scale: dot.scale }],
                            opacity: dot.opacity,
                        },
                    ]}
                />
            ))}
        </View>
    )
}

export default function LoadingScreen() {
    const dispatch = useAppDispatch()
    const pathname = usePathname()
    const { user, hasCheckedAuth } = useSelector((state: any) => state.auth)
    const [redirectAttempted, setRedirectAttempted] = useState<string | null>(null)

    const fadeAnim = useRef(new Animated.Value(0)).current
    const logoScale = useRef(new Animated.Value(0.8)).current
    const logoRotate = useRef(new Animated.Value(0)).current
    const glowAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        // Animación de entrada
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.timing(logoRotate, {
                    toValue: 1,
                    duration: 20000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ]),
            ),
        ]).start()

        if (!hasCheckedAuth) {
            dispatch(checkAuth())
        }
    }, [dispatch, hasCheckedAuth])

    useEffect(() => {
        if (hasCheckedAuth && !redirectAttempted) {
            const timer = setTimeout(() => {
                if (user && pathname !== "/(tabs)") {
                    setRedirectAttempted("/(tabs)")
                    router.push("/(tabs)")
                } else if (!user && pathname !== "/login") {
                    setRedirectAttempted("/login")
                    router.push("/login")
                }
            }, 1200)

            return () => clearTimeout(timer)
        }
    }, [hasCheckedAuth, user, pathname, redirectAttempted])

    const logoRotation = logoRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    })

    const glowIntensity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    })

    return (
        <LinearGradient
            colors={["#0f172a", "#1e293b", "#334155"]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Ondas de energía de fondo */}
            <EnergyWaves />

            {/* Partículas flotantes */}
            <FloatingParticles />

            {/* Contenido principal (solo logo y resplandor) */}
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Resplandor dinámico detrás del logo */}
                <Animated.View
                    style={[
                        styles.dynamicGlow,
                        {
                            opacity: glowIntensity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                />

                {/* Logo principal con animaciones */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            transform: [{ scale: logoScale }, { rotate: logoRotation }],
                        },
                    ]}
                >
                    <View style={styles.logoCircle}>
                        <Image
                            source={require("../assets/images/logoaleb.png")}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                </Animated.View>
            </Animated.View>

            {/* Indicador de carga mejorado */}
            <View style={styles.dotsWrapper}>
                <PulsingDots />
            </View>

            {/* Elementos decorativos con gradientes dinámicos */}
            <View style={styles.decorativeElements}>
                <LinearGradient colors={["#f97316", "transparent"]} style={[styles.floatingElement, styles.element1]} />
                <LinearGradient colors={["#3b82f6", "transparent"]} style={[styles.floatingElement, styles.element2]} />
                <LinearGradient colors={["#f97316", "#3b82f6"]} style={[styles.floatingElement, styles.element3]} />
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f172a",
    },
    content: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        zIndex: 3,
    },
    wavesContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        zIndex: 1,
    },
    particlesContainer: {
        position: "absolute",
        width: "100%",
        height: "100%",
        zIndex: 1,
    },
    particle: {
        position: "absolute",
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#f97316",
    },
    dynamicGlow: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: "#f97316",
        opacity: 0.3,
    },
    logoContainer: {
        zIndex: 4,
    },
    logoCircle: {
        width: 140,
        height: 140,
        backgroundColor: "#fff",
        borderRadius: 70,
        justifyContent: "center",
        alignItems: "center",
        elevation: 12,
        shadowColor: "#f97316",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        borderWidth: 3,
        borderColor: "#f97316",
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    dotsWrapper: {
        position: "absolute",
        bottom: 100, 
        alignItems: "center",
        width: "100%",
        zIndex: 3,
    },
    dotsContainer: {
        flexDirection: "row",
        gap: 12,
    },
    modernDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#ffffffff",
        shadowColor: "#ffffffff",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 4,
    },
    decorativeElements: {
        position: "absolute",
        width: "100%",
        height: "100%",
        zIndex: 0,
    },
    floatingElement: {
        position: "absolute",
        borderRadius: 100,
        opacity: 0.1,
    },
    element1: {
        width: 150,
        height: 150,
        top: "10%",
        right: "5%",
    },
    element2: {
        width: 100,
        height: 100,
        bottom: "25%",
        left: "10%",
    },
    element3: {
        width: 200,
        height: 200,
        top: "55%",
        left: "60%",
    },
})