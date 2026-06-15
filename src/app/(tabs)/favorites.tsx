import { Href, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react-native";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { palette, styles } from "@/features/favorites/favorites.styles";
import { useTranslations } from "@/i18n";
import { ProductItem } from "@/services/catalog";
import { useCartStore } from "@/store/cart";
import { useFavoriteStore } from "@/store/favorites";

const catalogHref = "/" as Href;

function formatPrice(value: number) {
    return `${Math.ceil(value)} TMT`;
}

function FavoriteItem({ product }: { product: ProductItem }) {
    const router = useRouter();
    const t = useTranslations();
    const addItem = useCartStore((state) => state.addItem);
    const removeFavorite = useFavoriteStore((state) => state.removeFavorite);

    function openProduct() {
        if (product.slug) {
            router.push({
                pathname: "/products/[slug]",
                params: { slug: product.slug },
            });
        }
    }

    return (
        <View style={styles.item}>
            <TouchableOpacity
                activeOpacity={0.82}
                style={styles.imageWrap}
                onPress={openProduct}
            >
                {product.image ? (
                    <Image
                        source={{ uri: product.image }}
                        cachePolicy="memory-disk"
                        recyclingKey={`favorite-${product.id}`}
                        contentFit="contain"
                        style={styles.image}
                    />
                ) : null}
            </TouchableOpacity>

            <View style={styles.body}>
                <View style={styles.topRow}>
                    <TouchableOpacity
                        activeOpacity={0.82}
                        style={{ flex: 1 }}
                        onPress={openProduct}
                    >
                        <ThemedText numberOfLines={2} style={styles.title}>
                            {product.title}
                        </ThemedText>
                        <ThemedText numberOfLines={1} style={styles.category}>
                            {product.category}
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        hitSlop={8}
                        activeOpacity={0.76}
                        onPress={() => removeFavorite(product.id)}
                    >
                        <Trash2
                            color={palette.secondary}
                            size={19}
                            strokeWidth={2.1}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomRow}>
                    <ThemedText style={styles.price}>
                        {formatPrice(product.price)}
                    </ThemedText>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.addButton}
                        onPress={() => addItem(product)}
                    >
                        <ThemedText style={styles.addButtonText}>
                            {t("addToCart")}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default function FavoritesScreen() {
    const router = useRouter();
    const t = useTranslations();
    const items = useFavoriteStore((state) => state.items);

    if (!items.length) {
        return (
            <SafeAreaView style={styles.root}>
                <View style={styles.emptyWrap}>
                    <View style={styles.emptyIcon}>
                        <Heart
                            color={palette.primary}
                            size={36}
                            strokeWidth={2}
                        />
                    </View>
                    <ThemedText style={styles.emptyTitle}>
                        {t("emptyFavorites")}
                    </ThemedText>
                    <ThemedText style={styles.emptyText}>
                        {t("emptyFavoritesText")}
                    </ThemedText>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.continueButton}
                        onPress={() => router.replace(catalogHref)}
                    >
                        <ThemedText style={styles.continueButtonText}>
                            {t("goToCatalog")}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft
                            color={palette.primary}
                            size={22}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>
                        {t("favorites")}
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.push("/cart")}
                    >
                        <ShoppingCart
                            color={palette.primary}
                            size={21}
                            strokeWidth={2.1}
                        />
                    </TouchableOpacity>
                </View>

                {items.map((product) => (
                    <FavoriteItem key={product.id} product={product} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
