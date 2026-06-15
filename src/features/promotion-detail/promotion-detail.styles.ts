import { StyleSheet } from "react-native";

export const palette = {
    primary: "#212121",
    secondary: "#8c8c8c",
    border: "#e4e4e4",
    surface: "#ffffff",
    soft: "#f6f6f6",
    sale: "#ea4040",
};

export const htmlBaseStyle = {
    color: palette.primary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500" as const,
};

export const htmlTags = {
    p: {
        marginTop: 0,
        marginBottom: 8,
    },
    strong: {
        fontWeight: "800" as const,
    },
    b: {
        fontWeight: "800" as const,
    },
};

export const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: palette.surface,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 108,
        gap: 18,
    },
    header: {
        minHeight: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: palette.border,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.surface,
    },
    headerSpacer: {
        width: 42,
        height: 42,
    },
    headerTitle: {
        color: palette.primary,
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "800",
    },
    hero: {
        minHeight: 156,
        overflow: "hidden",
        borderRadius: 8,
        backgroundColor: palette.soft,
        alignItems: "center",
        justifyContent: "center",
    },
    heroImage: {
        width: "100%",
        aspectRatio: 16 / 7.5,
    },
    title: {
        color: palette.primary,
        fontSize: 25,
        lineHeight: 31,
        fontWeight: "900",
    },
    description: {
        gap: 4,
    },
    sectionTitle: {
        color: palette.primary,
        fontSize: 20,
        lineHeight: 26,
        fontWeight: "900",
    },
    productColumn: {
        justifyContent: "space-between",
        marginBottom: 20,
    },
    footer: {
        gap: 12,
    },
    loadingWrap: {
        flex: 1,
        minHeight: 360,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingHorizontal: 20,
    },
    loadingText: {
        color: palette.secondary,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "600",
        textAlign: "center",
    },
    errorText: {
        color: palette.sale,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        textAlign: "center",
    },
    productsLoading: {
        minHeight: 160,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyBlock: {
        minHeight: 220,
        gap: 14,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 18,
        backgroundColor: palette.soft,
    },
    emptyTitle: {
        color: palette.primary,
        fontSize: 17,
        lineHeight: 23,
        fontWeight: "800",
        textAlign: "center",
    },
    catalogButton: {
        minHeight: 44,
        borderRadius: 8,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.primary,
        alignSelf: "center",
    },
    catalogButtonText: {
        color: palette.surface,
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "800",
    },
});
