import { useNetInfo } from "@react-native-community/netinfo";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    Heart,
    Minus,
    Plus,
    ShoppingBag,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductDetailSkeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { getProductBySlug, ProductDetail } from "@/services/catalog";
import {
    descriptionHtmlBaseStyle,
    descriptionHtmlTags,
    palette,
    styles,
} from "@/features/product-detail/product-detail.styles";
import { CartVariation, useCartStore } from "@/store/cart";
import { useFavoriteStore } from "@/store/favorites";

function normalizeProductHtml(value: string) {
    return value.replace(/&nbsp;|&#160;|&#xA0;/gi, " ").replace(/\u00a0/g, " ");
}

function getTextFromHtml(value: string) {
    return normalizeProductHtml(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export default function ProductDetailScreen() {
    const router = useRouter();
    const netInfo = useNetInfo();
    const { width } = useWindowDimensions();
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] =
        useState<CartVariation | null>(null);
    const [quantityToAdd, setQuantityToAdd] = useState(1);
    const [addedMessage, setAddedMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const addItem = useCartStore((state) => state.addItem);
    const totalQuantity = useCartStore((state) => state.totalQuantity());
    const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
    const isFavorite = useFavoriteStore((state) =>
        product ? state.isFavorite(product.id) : false
    );
    const isOffline =
        netInfo.isConnected === false || netInfo.isInternetReachable === false;

    useEffect(() => {
        let alive = true;

        async function loadProduct() {
            if (!slug) return;

            try {
                setLoading(true);
                setError(null);
                const data = await getProductBySlug(slug);
                if (alive) {
                    setProduct(data);
                    setActiveImage(data.image);

                    const firstActiveVariation = data.variations.find(
                        (variation) => variation.isActive !== false
                    );
                    if (firstActiveVariation) {
                        setSelectedVariation({
                            id: firstActiveVariation.id,
                            label: [
                                firstActiveVariation.typeName,
                                firstActiveVariation.value,
                            ]
                                .filter(Boolean)
                                .join(": "),
                        });
                        setActiveImage(
                            firstActiveVariation.gallery?.[0]?.image ||
                                data.image
                        );
                    } else {
                        setSelectedVariation(null);
                    }
                }
            } catch (requestError) {
                if (alive) {
                    setError(
                        isOffline
                            ? "Нет интернета. Этот товар еще не сохранен для оффлайна."
                            : requestError instanceof Error
                            ? requestError.message
                            : "Не удалось загрузить товар"
                    );
                }
            } finally {
                if (alive) setLoading(false);
            }
        }

        loadProduct();
        return () => {
            alive = false;
        };
    }, [isOffline, slug]);

    if (loading) {
        return (
            <SafeAreaView style={styles.root}>
                <ProductDetailSkeleton />
            </SafeAreaView>
        );
    }

    if (error || !product) {
        return (
            <SafeAreaView style={styles.root}>
                <View style={styles.loadingWrap}>
                    <ThemedText style={styles.statusText}>
                        {error || "Товар не найден"}
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft
                            color={palette.primary}
                            size={22}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const galleryImages = [
        ...(product.image ? [{ id: product.id, image: product.image }] : []),
        ...product.gallery,
    ];
    const outOfStock = product.count !== undefined && product.count < 1;
    const descriptionHtml = normalizeProductHtml(product.description);
    const descriptionText = getTextFromHtml(product.description);
    const visibleImage = activeImage || product.image;
    const maxQuantity = product.count && product.count > 0 ? product.count : 99;

    function addProductToCart() {
        if (!product) return;

        Array.from({ length: quantityToAdd }).forEach(() =>
            addItem(product, selectedVariation)
        );
        setAddedMessage(`Добавлено: ${quantityToAdd} шт.`);
        setTimeout(() => setAddedMessage(""), 1800);
    }

    function decrementQuantity() {
        setQuantityToAdd((value) => Math.max(1, value - 1));
    }

    function incrementQuantity() {
        setQuantityToAdd((value) => Math.min(maxQuantity, value + 1));
    }

    function selectVariation(variation: ProductDetail["variations"][number]) {
        if (!product) return;

        setSelectedVariation({
            id: variation.id,
            label: [variation.typeName, variation.value]
                .filter(Boolean)
                .join(": "),
        });
        setActiveImage(variation.gallery?.[0]?.image || product.image);
        setAddedMessage("");
    }

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft
                            color={palette.primary}
                            size={22}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Товар</ThemedText>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={() => toggleFavorite(product)}
                        >
                            <Heart
                                color={
                                    isFavorite ? palette.sale : palette.primary
                                }
                                fill={isFavorite ? palette.sale : "transparent"}
                                size={21}
                                strokeWidth={2.1}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={() => router.push("/cart")}
                        >
                            <ShoppingBag
                                color={palette.primary}
                                size={21}
                                strokeWidth={2.1}
                            />
                            {totalQuantity ? (
                                <View style={styles.cartBadge}>
                                    <ThemedText style={styles.cartBadgeText}>
                                        {totalQuantity}
                                    </ThemedText>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.imageWrap}>
                    {visibleImage ? (
                        <Image
                            source={{ uri: visibleImage }}
                            contentFit="contain"
                            style={styles.image}
                        />
                    ) : (
                        <ThemedText style={styles.imageFallback}>
                            Нет фото
                        </ThemedText>
                    )}
                </View>

                {galleryImages.length > 1 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.gallery}
                    >
                        {galleryImages.map((image) => (
                            <TouchableOpacity
                                activeOpacity={0.82}
                                key={`${image.id}-${image.image}`}
                                style={[
                                    styles.galleryItem,
                                    image.image === visibleImage &&
                                        styles.galleryItemActive,
                                ]}
                                onPress={() => setActiveImage(image.image)}
                            >
                                {image.image ? (
                                    <Image
                                        source={{ uri: image.image }}
                                        contentFit="contain"
                                        style={styles.galleryImage}
                                    />
                                ) : null}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : null}

                <View>
                    <ThemedText style={styles.title}>
                        {product.title}
                    </ThemedText>
                    <ThemedText style={styles.category}>
                        {product.category}
                    </ThemedText>
                </View>

                <View style={styles.priceRow}>
                    <ThemedText
                        style={[
                            styles.price,
                            product.oldPrice ? styles.salePrice : null,
                        ]}
                    >
                        {product.price} TMT
                    </ThemedText>
                    {product.oldPrice ? (
                        <ThemedText style={styles.oldPrice}>
                            {product.oldPrice} TMT
                        </ThemedText>
                    ) : null}
                </View>

                {product.variations.length ? (
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            Варианты
                        </ThemedText>
                        <View style={styles.variationList}>
                            {product.variations.map((variation) => (
                                <TouchableOpacity
                                    activeOpacity={0.82}
                                    disabled={variation.isActive === false}
                                    key={variation.id}
                                    style={[
                                        styles.variationChip,
                                        selectedVariation?.id ===
                                            variation.id &&
                                            styles.variationChipActive,
                                        variation.isActive === false &&
                                            styles.variationChipDisabled,
                                    ]}
                                    onPress={() => selectVariation(variation)}
                                >
                                    <ThemedText
                                        style={[
                                            styles.variationText,
                                            selectedVariation?.id ===
                                                variation.id &&
                                                styles.variationTextActive,
                                            variation.isActive === false &&
                                                styles.variationTextDisabled,
                                        ]}
                                    >
                                        {[variation.typeName, variation.value]
                                            .filter(Boolean)
                                            .join(": ")}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : null}

                {descriptionText ? (
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            Описание
                        </ThemedText>
                        <RenderHTML
                            contentWidth={width - 32}
                            source={{ html: descriptionHtml }}
                            baseStyle={descriptionHtmlBaseStyle}
                            tagsStyles={descriptionHtmlTags}
                        />
                    </View>
                ) : null}
            </ScrollView>

            <View style={styles.bottomBar}>
                <View style={styles.quantityRow}>
                    <ThemedText style={styles.quantityLabel}>
                        Количество
                    </ThemedText>
                    <View style={styles.quantityControl}>
                        <TouchableOpacity
                            activeOpacity={0.78}
                            disabled={quantityToAdd <= 1}
                            style={[
                                styles.quantityButton,
                                quantityToAdd <= 1 &&
                                    styles.quantityButtonDisabled,
                            ]}
                            onPress={decrementQuantity}
                        >
                            <Minus
                                color={palette.primary}
                                size={18}
                                strokeWidth={2.4}
                            />
                        </TouchableOpacity>
                        <ThemedText style={styles.quantityText}>
                            {quantityToAdd}
                        </ThemedText>
                        <TouchableOpacity
                            activeOpacity={0.78}
                            disabled={quantityToAdd >= maxQuantity}
                            style={[
                                styles.quantityButton,
                                quantityToAdd >= maxQuantity &&
                                    styles.quantityButtonDisabled,
                            ]}
                            onPress={incrementQuantity}
                        >
                            <Plus
                                color={
                                    quantityToAdd >= maxQuantity
                                        ? palette.secondary
                                        : palette.primary
                                }
                                size={18}
                                strokeWidth={2.4}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                {addedMessage ? (
                    <View style={styles.addedNotice}>
                        <Check
                            color={palette.success}
                            size={17}
                            strokeWidth={2.3}
                        />
                        <ThemedText style={styles.addedNoticeText}>
                            {addedMessage}
                        </ThemedText>
                    </View>
                ) : null}
                <TouchableOpacity
                    activeOpacity={0.86}
                    disabled={outOfStock}
                    style={[
                        styles.cartButton,
                        outOfStock && styles.cartButtonDisabled,
                    ]}
                    onPress={addProductToCart}
                >
                    <ThemedText style={styles.cartButtonText}>
                        {outOfStock ? "Нет в наличии" : "В корзину"}
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
