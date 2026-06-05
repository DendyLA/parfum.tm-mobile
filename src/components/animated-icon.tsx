import { Image } from "expo-image";
import { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, { Easing, Keyframe } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const INITIAL_SCALE_FACTOR = Dimensions.get("screen").height / 90;
const DURATION = 1150;

export function AnimatedSplashOverlay() {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    const splashKeyframe = new Keyframe({
        0: {
            opacity: 1,
        },
        72: {
            opacity: 1,
        },
        100: {
            opacity: 0,
        },
    });

    return (
        <Animated.View
            entering={splashKeyframe
                .duration(DURATION)
                .withCallback((finished) => {
                    "worklet";
                    if (finished) {
                        scheduleOnRN(setVisible, false);
                    }
                })}
            style={styles.backgroundSolidColor}
        >
            <Animated.View
                entering={logoKeyframe.duration(760)}
                style={styles.splashContent}
            >
                <Image
                    style={styles.splashLogo}
                    contentFit="contain"
                    source={require("@/assets/images/parfum-logo.png")}
                />
                <View style={styles.splashAccent} />
                <Animated.Text style={styles.splashText}>
                    Beauty Store
                </Animated.Text>
            </Animated.View>
        </Animated.View>
    );
}

const keyframe = new Keyframe({
    0: {
        transform: [{ scale: INITIAL_SCALE_FACTOR }],
    },
    100: {
        transform: [{ scale: 1 }],
        easing: Easing.elastic(0.7),
    },
});

const logoKeyframe = new Keyframe({
    0: {
        transform: [{ scale: 1.3 }],
        opacity: 0,
    },
    40: {
        transform: [{ scale: 1.3 }],
        opacity: 0,
        easing: Easing.elastic(0.7),
    },
    100: {
        opacity: 1,
        transform: [{ scale: 1 }],
        easing: Easing.elastic(0.7),
    },
});

const glowKeyframe = new Keyframe({
    0: {
        transform: [{ rotateZ: "0deg" }],
    },
    100: {
        transform: [{ rotateZ: "7200deg" }],
    },
});

export function AnimatedIcon() {
    return (
        <View style={styles.iconContainer}>
            <Animated.View
                entering={glowKeyframe.duration(60 * 1000 * 4)}
                style={styles.glow}
            >
                <Image
                    style={styles.glow}
                    source={require("@/assets/images/logo-glow.png")}
                />
            </Animated.View>

            <Animated.View
                entering={keyframe.duration(DURATION)}
                style={styles.background}
            />
            <Animated.View
                style={styles.imageContainer}
                entering={logoKeyframe.duration(DURATION)}
            >
                <Image
                    style={styles.image}
                    contentFit="contain"
                    source={require("@/assets/images/parfum-logo.png")}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    glow: {
        width: 201,
        height: 201,
        position: "absolute",
    },
    iconContainer: {
        justifyContent: "center",
        alignItems: "center",
        width: 128,
        height: 128,
        zIndex: 100,
    },
    image: {
        position: "absolute",
        width: 96,
        height: 42,
    },
    background: {
        borderRadius: 40,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e4e4e4",
        width: 128,
        height: 128,
        position: "absolute",
    },
    backgroundSolidColor: {
        ...StyleSheet.absoluteFill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        zIndex: 1000,
    },
    splashContent: {
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
    },
    splashLogo: {
        width: 230,
        height: 88,
    },
    splashAccent: {
        width: 118,
        height: 3,
        borderRadius: 2,
        backgroundColor: "#5b24c9",
    },
    splashText: {
        color: "#aeaeae",
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
        letterSpacing: 0,
        textTransform: "uppercase",
    },
});
