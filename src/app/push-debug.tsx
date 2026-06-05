import { useRouter } from "expo-router";
import { ArrowLeft, RefreshCw } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import {
    getPushRegistrationStatus,
    PushRegistrationStatus,
    registerForPushNotifications,
} from "@/services/push-notifications";

const palette = {
    primary: "#212121",
    secondary: "#8c8c8c",
    border: "#e4e4e4",
    surface: "#ffffff",
    soft: "#f6f6f6",
    sale: "#ea4040",
    success: "#1f7a1f",
};

function statusColor(status?: PushRegistrationStatus["status"]) {
    if (status === "registered") return palette.success;
    if (status === "failed" || status === "permission-denied") {
        return palette.sale;
    }
    return palette.primary;
}

function Row({ label, value }: { label: string; value?: string | boolean | null }) {
    return (
        <View style={{ gap: 4 }}>
            <ThemedText
                style={{
                    color: palette.secondary,
                    fontSize: 12,
                    lineHeight: 16,
                    fontWeight: "700",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </ThemedText>
            <ThemedText
                style={{
                    color: palette.primary,
                    fontSize: 15,
                    lineHeight: 21,
                    fontWeight: "700",
                }}
            >
                {value === undefined || value === null ? "Не указано" : String(value)}
            </ThemedText>
        </View>
    );
}

export default function PushDebugScreen() {
    const router = useRouter();
    const [status, setStatus] = useState<PushRegistrationStatus | null>(null);
    const [loading, setLoading] = useState(false);

    async function refreshStatus() {
        setStatus(await getPushRegistrationStatus());
    }

    async function retryRegistration() {
        try {
            setLoading(true);
            await registerForPushNotifications();
        } finally {
            await refreshStatus();
            setLoading(false);
        }
    }

    useEffect(() => {
        refreshStatus();
    }, []);

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: palette.surface,
                paddingHorizontal: 16,
            }}
        >
            <View
                style={{
                    minHeight: 58,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.86}
                    onPress={() => router.back()}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        borderWidth: 1,
                        borderColor: palette.border,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ArrowLeft color={palette.primary} size={22} />
                </TouchableOpacity>
                <ThemedText
                    style={{
                        color: palette.primary,
                        fontSize: 18,
                        lineHeight: 24,
                        fontWeight: "900",
                    }}
                >
                    Push debug
                </ThemedText>
                <View style={{ width: 42, height: 42 }} />
            </View>

            <View
                style={{
                    gap: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: palette.border,
                    padding: 14,
                    backgroundColor: palette.soft,
                }}
            >
                <ThemedText
                    style={{
                        color: statusColor(status?.status),
                        fontSize: 18,
                        lineHeight: 24,
                        fontWeight: "900",
                    }}
                >
                    {status?.status || "idle"}
                </ThemedText>
                <ThemedText
                    style={{
                        color: palette.primary,
                        fontSize: 14,
                        lineHeight: 20,
                        fontWeight: "600",
                    }}
                >
                    {status?.message || "Статус push еще не записан."}
                </ThemedText>
                <Row label="Updated" value={status?.updatedAt} />
                <Row label="Token" value={status?.tokenPreview} />
                <Row label="Permission" value={status?.permissionStatus} />
                <Row label="Expo ownership" value={status?.appOwnership} />
                <Row
                    label="Execution"
                    value={status?.executionEnvironment}
                />
                <Row label="Physical device" value={status?.isDevice} />
                <Row label="Project ID" value={status?.projectId} />
            </View>

            <TouchableOpacity
                activeOpacity={0.86}
                disabled={loading}
                onPress={retryRegistration}
                style={{
                    minHeight: 48,
                    marginTop: 16,
                    borderRadius: 8,
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: palette.primary,
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? (
                    <ActivityIndicator color={palette.surface} />
                ) : (
                    <RefreshCw color={palette.surface} size={18} />
                )}
                <ThemedText
                    style={{
                        color: palette.surface,
                        fontSize: 15,
                        lineHeight: 20,
                        fontWeight: "900",
                    }}
                >
                    Проверить снова
                </ThemedText>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
