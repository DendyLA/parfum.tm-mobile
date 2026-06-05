import { StyleSheet, View, ViewStyle } from "react-native";

const skeletonColor = "#eeeeee";

export function Skeleton({
    style,
}: {
    style?: ViewStyle | ViewStyle[];
}) {
    return <View style={[styles.base, style]} />;
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <View style={styles.productGrid}>
            {Array.from({ length: count }).map((_, index) => (
                <View key={index} style={styles.productCard}>
                    <Skeleton style={styles.productImage} />
                    <Skeleton style={styles.productTitle} />
                    <Skeleton style={styles.productLine} />
                    <Skeleton style={styles.productPrice} />
                    <Skeleton style={styles.productButton} />
                </View>
            ))}
        </View>
    );
}

export function HomeSkeleton() {
    return (
        <View style={styles.homeWrap}>
            <Skeleton style={styles.banner} />
            <ProductGridSkeleton count={4} />
        </View>
    );
}

export function ProductDetailSkeleton() {
    return (
        <View style={styles.detailWrap}>
            <Skeleton style={styles.detailImage} />
            <Skeleton style={styles.detailTitle} />
            <Skeleton style={styles.detailLineWide} />
            <Skeleton style={styles.detailPrice} />
            <Skeleton style={styles.detailLineWide} />
            <Skeleton style={styles.detailLine} />
            <Skeleton style={styles.detailButton} />
        </View>
    );
}

export function PromotionSkeleton() {
    return (
        <View style={styles.detailWrap}>
            <Skeleton style={styles.promoImage} />
            <Skeleton style={styles.detailTitle} />
            <Skeleton style={styles.detailLineWide} />
            <ProductGridSkeleton count={4} />
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: skeletonColor,
        borderRadius: 8,
    },
    homeWrap: {
        gap: 18,
    },
    banner: {
        width: "100%",
        height: 118,
    },
    productGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 20,
    },
    productCard: {
        width: "47.8%",
        minWidth: 0,
        gap: 10,
    },
    productImage: {
        width: "100%",
        aspectRatio: 4 / 5,
    },
    productTitle: {
        width: "92%",
        height: 18,
    },
    productLine: {
        width: "66%",
        height: 14,
    },
    productPrice: {
        width: "54%",
        height: 20,
    },
    productButton: {
        width: "100%",
        height: 42,
        borderRadius: 6,
    },
    detailWrap: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 16,
        width: "100%",
    },
    detailImage: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 10,
    },
    promoImage: {
        width: "100%",
        aspectRatio: 16 / 7.5,
    },
    detailTitle: {
        width: "82%",
        height: 28,
    },
    detailLineWide: {
        width: "100%",
        height: 16,
    },
    detailLine: {
        width: "72%",
        height: 16,
    },
    detailPrice: {
        width: "42%",
        height: 28,
    },
    detailButton: {
        width: "100%",
        height: 52,
    },
});
