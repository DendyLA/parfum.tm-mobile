import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

export function OfflineBanner({ visible }: { visible: boolean }) {
    if (!visible) return null;

    return (
        <View style={styles.banner}>
            <ThemedText style={styles.text}>
                Оффлайн: показываем сохраненные товары
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        minHeight: 36,
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
        fontWeight: "700",
        textAlign: "center",
    },
});
