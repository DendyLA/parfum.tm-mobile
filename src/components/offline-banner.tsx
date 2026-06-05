import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

function formatUpdatedAt(value?: string | null) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function OfflineBanner({
    visible,
    updatedAt,
}: {
    visible: boolean;
    updatedAt?: string | null;
}) {
    if (!visible) return null;

    const formattedDate = formatUpdatedAt(updatedAt);

    return (
        <View style={styles.banner}>
            <ThemedText style={styles.text}>
                Оффлайн: показываем сохраненные товары
            </ThemedText>
            {formattedDate ? (
                <ThemedText style={styles.meta}>
                    Обновлено: {formattedDate}
                </ThemedText>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        minHeight: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#f0d7a1",
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: "center",
        backgroundColor: "#fff7e6",
    },
    text: {
        color: "#6f4b00",
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "800",
        textAlign: "center",
    },
    meta: {
        color: "#8a650f",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 2,
    },
});
