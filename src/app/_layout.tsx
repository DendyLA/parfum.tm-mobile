import { useNetInfo } from "@react-native-community/netinfo";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import {
    registerForPushNotifications,
    subscribeToPromotionPushClicks,
} from "@/services/push-notifications";

function PushNotificationBridge() {
    const router = useRouter();
    const netInfo = useNetInfo();
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const registeringRef = useRef(false);

    const tryRegister = useCallback(async () => {
        if (registeringRef.current) return;

        registeringRef.current = true;
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }

        try {
            await registerForPushNotifications();
        } catch (error) {
            console.warn("Push registration failed", error);
            retryTimerRef.current = setTimeout(() => {
                tryRegister();
            }, 30000);
        } finally {
            registeringRef.current = false;
        }
    }, []);

    useEffect(() => {
        let cleanup: () => void = () => {};
        let mounted = true;

        tryRegister();

        subscribeToPromotionPushClicks((promotionId) => {
            router.push(`/promotion?id=${promotionId}`);
        })
            .then((unsubscribe) => {
                if (mounted) {
                    cleanup = unsubscribe;
                } else {
                    unsubscribe();
                }
            })
            .catch((error) => {
                console.warn("Push click listener failed", error);
            });

        return () => {
            mounted = false;
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
            }
            cleanup();
        };
    }, [router, tryRegister]);

    useEffect(() => {
        const isOnline =
            netInfo.isConnected !== false &&
            netInfo.isInternetReachable !== false;

        if (isOnline) {
            tryRegister();
        }
    }, [netInfo.isConnected, netInfo.isInternetReachable, tryRegister]);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                tryRegister();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [tryRegister]);

    return null;
}

export default function RootLayout() {
    const colorScheme = useColorScheme();
    return (
        <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="checkout" />
                <Stack.Screen name="products/[slug]" />
                <Stack.Screen name="promotion" />
                <Stack.Screen name="push-debug" />
            </Stack>
            <PushNotificationBridge />
            <AnimatedSplashOverlay />
        </ThemeProvider>
    );
}
