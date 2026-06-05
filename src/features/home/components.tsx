import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import { Heart, ShoppingBag, X } from "lucide-react-native";
import { ReactNode, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
    CategoryItem,
    CurrentPromotion,
    getPromotionCatalogParams,
    ProductItem,
    PromoItem,
} from "@/services/catalog";
import { useCartStore } from "@/store/cart";
import { useFavoriteStore } from "@/store/favorites";

import { palette, styles } from "./home.styles";

function usePromotionNavigation() {
    const router = useRouter();

    return (promotion?: { id: number | null; link?: string }) => {
        if (!promotion?.id || !getPromotionCatalogParams(promotion.link)) {
            return;
        }

        router.push(`/promotion?id=${promotion.id}` as Href);
    };
}

export function HomeHeader() {
    const router = useRouter();
    const totalQuantity = useCartStore((state) => state.totalQuantity());
    const totalFavorites = useFavoriteStore((state) => state.totalFavorites());

    return (
        <View style={styles.header}>
            <View style={styles.logoBlock}>
                <Image
                    source={require("@/assets/images/parfum-logo.png")}
                    contentFit="contain"
                    style={styles.logoImage}
                />
                <ThemedText style={styles.tagline}>
                    Косметика и парфюмерия
                </ThemedText>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.basketButton}
                    onPress={() => router.push("/favorites")}
                >
                    <Heart color={palette.primary} size={22} strokeWidth={2} />
                    {totalFavorites ? (
                        <View style={styles.basketBadge}>
                            <ThemedText style={styles.basketBadgeText}>
                                {totalFavorites}
                            </ThemedText>
                        </View>
                    ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.basketButton}
                    onPress={() => router.push("/cart")}
                >
                    <ShoppingBag
                        color={palette.primary}
                        size={22}
                        strokeWidth={2}
                    />
                    {totalQuantity ? (
                        <View style={styles.basketBadge}>
                            <ThemedText style={styles.basketBadgeText}>
                                {totalQuantity}
                            </ThemedText>
                        </View>
                    ) : null}
                </TouchableOpacity>
            </View>
        </View>
    );
}

export function SectionHeader({
    title,
    action,
    onAction,
}: {
    title: string;
    action?: string;
    onAction?: () => void;
}) {
    return (
        <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
            {action ? (
                <TouchableOpacity hitSlop={10} onPress={onAction}>
                    <ThemedText style={styles.sectionAction}>
                        {action}
                    </ThemedText>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

export function SearchCategoryBar({
    searchText,
    activeSearch,
    selectedCategory,
    parentCategories,
    childCategories,
    onSearchTextChange,
    onSubmitSearch,
    onClearSearch,
    onSelectCategory,
}: {
    searchText: string;
    activeSearch: string;
    selectedCategory: CategoryItem | null;
    parentCategories: CategoryItem[];
    childCategories: CategoryItem[];
    onSearchTextChange: (value: string) => void;
    onSubmitSearch: () => void;
    onClearSearch: () => void;
    onSelectCategory: (category: CategoryItem | null) => void;
}) {
    const subcategoryScrollRef = useRef<ScrollView>(null);
    const allActive = !selectedCategory && !activeSearch;

    useEffect(() => {
        subcategoryScrollRef.current?.scrollTo({ x: 0, animated: false });
    }, [childCategories]);

    return (
        <View style={styles.stickyPanel}>
            <View style={styles.searchWrap}>
                <TextInput
                    value={searchText}
                    onChangeText={onSearchTextChange}
                    onSubmitEditing={onSubmitSearch}
                    placeholder="Поиск товаров, брендов, категорий"
                    placeholderTextColor={palette.secondary}
                    style={styles.searchInput}
                    returnKeyType="search"
                />
                {searchText ? (
                    <TouchableOpacity
                        hitSlop={10}
                        style={styles.searchClear}
                        onPress={onClearSearch}
                    >
                        <X
                            color={palette.secondary}
                            size={18}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>
                ) : null}
            </View>

            <ScrollView
                horizontal
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
            >
                <View style={styles.categoryIntro}>
                    <ThemedText style={styles.categoryIntroLabel}>
                        Категории
                    </ThemedText>
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                        styles.categoryChip,
                        allActive && styles.categoryChipActive,
                    ]}
                    onPress={() => onSelectCategory(null)}
                >
                    <ThemedText
                        style={[
                            styles.categoryText,
                            allActive && styles.categoryTextActive,
                        ]}
                    >
                        Все
                    </ThemedText>
                </TouchableOpacity>

                {parentCategories.map((category) => {
                    const isActive = selectedCategory?.id === category.id;
                    return (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            key={category.id}
                            style={[
                                styles.categoryChip,
                                isActive && styles.categoryChipActive,
                            ]}
                            onPress={() => onSelectCategory(category)}
                        >
                            <ThemedText
                                style={[
                                    styles.categoryText,
                                    isActive && styles.categoryTextActive,
                                ]}
                            >
                                {category.title}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {childCategories.length ? (
                <View style={styles.subcategoryPanel}>
                    <ThemedText style={styles.subcategoryTitle}>
                        Подкатегории
                    </ThemedText>
                    <ScrollView
                        ref={subcategoryScrollRef}
                        horizontal
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.subcategoryList}
                    >
                        {childCategories.map((category) => {
                            const isActive =
                                selectedCategory?.id === category.id;
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    key={category.id}
                                    style={[
                                        styles.subcategoryChip,
                                        isActive &&
                                            styles.subcategoryChipActive,
                                    ]}
                                    onPress={() => onSelectCategory(category)}
                                >
                                    <ThemedText
                                        style={[
                                            styles.subcategoryText,
                                            isActive &&
                                                styles.subcategoryTextActive,
                                        ]}
                                    >
                                        {category.title}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            ) : null}
        </View>
    );
}

export function ProductCard({ product }: { product: ProductItem }) {
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);
    const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
    const isFavorite = useFavoriteStore((state) =>
        state.isFavorite(product.id)
    );

    function openProduct() {
        if (product.slug) {
            router.push({
                pathname: "/products/[slug]",
                params: { slug: product.slug },
            });
        }
    }

    return (
        <TouchableOpacity
            activeOpacity={0.82}
            style={styles.productCard}
            onPress={openProduct}
        >
            <View style={styles.productImageWrap}>
                {product.image ? (
                    <Image
                        source={{ uri: product.image }}
                        contentFit="contain"
                        style={styles.productImage}
                    />
                ) : (
                    <ThemedText style={styles.imageFallback}>
                        Нет фото
                    </ThemedText>
                )}
                <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.productCardFavoriteIcon}
                    onPress={() => toggleFavorite(product)}
                >
                    <Heart
                        color={isFavorite ? palette.sale : palette.primary}
                        fill={isFavorite ? palette.sale : "transparent"}
                        size={17}
                        strokeWidth={2.2}
                    />
                </TouchableOpacity>
            </View>

            <ThemedText numberOfLines={2} style={styles.productTitle}>
                {product.title}
            </ThemedText>
            <ThemedText numberOfLines={1} style={styles.productCategory}>
                {product.category}
            </ThemedText>

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

            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.cartButton}
                onPress={() => addItem(product)}
            >
                <ThemedText style={styles.cartButtonText}>
                    В корзину
                </ThemedText>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

export function ProductGrid({ items }: { items: ProductItem[] }) {
    if (!items.length) {
        return (
            <ThemedText style={styles.emptyText}>
                Пока нет товаров
            </ThemedText>
        );
    }

    return (
        <View style={styles.productGrid}>
            {items.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </View>
    );
}

export function FeedStatus({
    loading,
    hasMore,
}: {
    loading: boolean;
    hasMore: boolean;
}) {
    return (
        <View style={styles.feedStatus}>
            {loading ? <ActivityIndicator color={palette.primary} /> : null}
            <ThemedText style={styles.feedStatusText}>
                {loading
                    ? "Загружаем еще товары"
                    : hasMore
                      ? "Листайте ниже, товары подгрузятся автоматически"
                      : "Все товары загружены"}
            </ThemedText>
        </View>
    );
}

export function ActiveResults({
    title,
    loading,
    products,
    feedLoading,
    feedHasMore,
    showFeedStatus,
    onReset,
}: {
    title: string;
    loading: boolean;
    products: ProductItem[];
    feedLoading: boolean;
    feedHasMore: boolean;
    showFeedStatus: boolean;
    onReset: () => void;
}) {
    return (
        <View style={styles.activeResults}>
            <SectionHeader title={title} action="Сброс" onAction={onReset} />
            {loading ? (
                <View style={styles.inlineLoader}>
                    <ActivityIndicator color={palette.primary} />
                </View>
            ) : (
                <>
                    <ProductGrid items={products} />
                    {showFeedStatus ? (
                        <FeedStatus
                            loading={feedLoading}
                            hasMore={feedHasMore}
                        />
                    ) : null}
                </>
            )}
        </View>
    );
}

export function WhatsNewCard({ promotion }: { promotion?: CurrentPromotion }) {
    const openPromotion = usePromotionNavigation();

    return (
        <View style={styles.whatsNew}>
            <View style={styles.whatsNewText}>
                <ThemedText style={styles.whatsNewLabel}>
                    Что нового
                </ThemedText>
                <ThemedText numberOfLines={2} style={styles.whatsNewBody}>
                    {promotion?.text ||
                        promotion?.title ||
                        "Загружаем актуальные предложения"}
                </ThemedText>
            </View>
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.whatsNewButton}
                onPress={() => openPromotion(promotion)}
            >
                <ThemedText style={styles.whatsNewButtonText}>
                    Открыть
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
}

export function LoadingCard() {
    return (
        <View style={styles.loadingCard}>
            <ActivityIndicator color={palette.primary} />
            <ThemedText style={styles.loadingText}>
                Загружаем витрину
            </ThemedText>
        </View>
    );
}

export function ErrorCard({ onRetry }: { onRetry: () => void }) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={styles.errorCard}
            onPress={onRetry}
        >
            <ThemedText style={styles.errorTitle}>
                Не удалось загрузить данные
            </ThemedText>
            <ThemedText style={styles.errorText}>
                Нажмите, чтобы попробовать снова
            </ThemedText>
        </TouchableOpacity>
    );
}

export function PromoCarousel({ promotions }: { promotions: PromoItem[] }) {
    const openPromotion = usePromotionNavigation();

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.heroList}
        >
            {promotions.map((slide) => (
                <TouchableOpacity
                    activeOpacity={0.86}
                    key={slide.id}
                    style={styles.heroCard}
                    onPress={() => openPromotion(slide)}
                >
                    {slide.image ? (
                        <Image
                            source={{ uri: slide.image }}
                            contentFit="cover"
                            style={styles.absoluteFill}
                        />
                    ) : null}
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroCopy}>
                        <ThemedText style={styles.heroTitle}>
                            {slide.title}
                        </ThemedText>
                        <ThemedText style={styles.heroSubtitle}>
                            {slide.subtitle}
                        </ThemedText>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

export function ProductSection({
    title,
    products,
    action,
    children,
}: {
    title: string;
    products: ProductItem[];
    action?: string;
    children?: ReactNode;
}) {
    if (!products.length) {
        return null;
    }

    return (
        <View style={styles.section}>
            <SectionHeader title={title} action={action} />
            <ProductGrid items={products} />
            {children}
        </View>
    );
}
