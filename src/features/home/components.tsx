import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import {
    ArrowLeft,
    Bell,
    Heart,
    Search,
    ShoppingCart,
    X,
} from "lucide-react-native";
import { ReactNode, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    SectionList,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { HomeSkeleton, ProductGridSkeleton } from "@/components/skeleton";
import {
    CategoryItem,
    BrandItem,
    getPromotionCatalogParams,
    ProductItem,
    PromoItem,
} from "@/services/catalog";
import { useCartStore } from "@/store/cart";
import { useFavoriteStore } from "@/store/favorites";
import { useLanguageStore } from "@/store/language";
import { useTranslations } from "@/i18n";

import { palette, styles } from "./home.styles";

function usePromotionNavigation() {
    const router = useRouter();

    return (
        promotion?: {
            id: number | null;
            link?: string;
            linkType?: string;
            link_type?: string;
            productsCount?: number;
            products_count?: number;
        }
    ) => {
        if (!promotion?.id || !isPromotionOpenable(promotion)) {
            return;
        }

        router.push(`/promotion?id=${promotion.id}` as Href);
    };
}

function isPromotionOpenable(
    promotion?: {
        link?: string;
        linkType?: string;
        link_type?: string;
        productsCount?: number;
        products_count?: number;
    } | null
) {
    if (!promotion) return false;

    const linkType = promotion.linkType || promotion.link_type;
    const productsCount =
        promotion.productsCount ?? promotion.products_count ?? 0;

    if (linkType === "products" || promotion.link?.startsWith("/promotions/")) {
        return productsCount > 0;
    }

    return Boolean(getPromotionCatalogParams(promotion.link));
}

export function HomeHeader() {
    const router = useRouter();
    const t = useTranslations();
    const totalQuantity = useCartStore((state) => state.totalQuantity());
    const totalFavorites = useFavoriteStore((state) => state.totalFavorites());
    const language = useLanguageStore((state) => state.language);
    const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);

    return (
        <View style={styles.header}>
            <View style={styles.logoBlock}>
                <Image
                    source={require("@/assets/images/parfum-logo.png")}
                    contentFit="contain"
                    style={styles.logoImage}
                />
                <ThemedText style={styles.tagline}>
                    {t("storeSubtitle")}
                </ThemedText>
            </View>
            <View style={styles.headerActions}>
                {__DEV__ ? (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.basketButton}
                        onPress={() => router.push("/push-debug" as Href)}
                    >
                        <Bell
                            color={palette.primary}
                            size={21}
                            strokeWidth={2}
                        />
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.languageButton}
                    onPress={toggleLanguage}
                >
                    <ThemedText style={styles.languageButtonText}>
                        {language === "ru" ? "RU" : "TM"}
                    </ThemedText>
                </TouchableOpacity>

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
                    <ShoppingCart
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
                <TouchableOpacity
                    hitSlop={10}
                    onPress={onAction}
                    style={styles.sectionActionButton}
                >
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
    suggestions,
    suggestionsLoading,
    onSearchTextChange,
    onSubmitSearch,
    onClearSearch,
    onOpenBrands,
    onCloseSuggestions,
}: {
    searchText: string;
    activeSearch: string;
    suggestions: ProductItem[];
    suggestionsLoading: boolean;
    onSearchTextChange: (value: string) => void;
    onSubmitSearch: () => void;
    onClearSearch: () => void;
    onOpenBrands: () => void;
    onCloseSuggestions: () => void;
}) {
    const router = useRouter();
    const t = useTranslations();
    const showSuggestions =
        searchText.trim().length >= 2 &&
        (suggestionsLoading || suggestions.length > 0);

    return (
        <View style={styles.stickyPanel}>
            <View style={styles.searchWrap}>
                <TextInput
                    value={searchText}
                    onChangeText={onSearchTextChange}
                    onSubmitEditing={onSubmitSearch}
                    placeholder={t("searchPlaceholder")}
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
                <TouchableOpacity
                    activeOpacity={0.82}
                    hitSlop={8}
                    style={styles.searchSubmit}
                    onPress={onSubmitSearch}
                >
                    <Search
                        color={palette.surface}
                        size={17}
                        strokeWidth={2.3}
                    />
                </TouchableOpacity>
            </View>

            {showSuggestions ? (
                <View style={styles.searchSuggestions}>
                    {suggestionsLoading && !suggestions.length ? (
                        <View style={styles.searchSuggestionLoading}>
                            <ActivityIndicator
                                color={palette.primary}
                                size="small"
                            />
                        </View>
                    ) : (
                        suggestions.map((product) => (
                            <TouchableOpacity
                                activeOpacity={0.84}
                                key={product.id}
                                style={styles.searchSuggestionItem}
                                onPress={() => {
                                    onCloseSuggestions();
                                    if (product.slug) {
                                        router.push({
                                            pathname: "/products/[slug]",
                                            params: { slug: product.slug },
                                        });
                                    }
                                }}
                            >
                                <View style={styles.searchSuggestionImageWrap}>
                                    {product.image ? (
                                        <Image
                                            source={{ uri: product.image }}
                                            cachePolicy="memory-disk"
                                            recyclingKey={`suggestion-${product.id}`}
                                            contentFit="contain"
                                            style={styles.searchSuggestionImage}
                                        />
                                    ) : null}
                                </View>
                                <View style={styles.searchSuggestionText}>
                                    <ThemedText
                                        numberOfLines={1}
                                        style={styles.searchSuggestionTitle}
                                    >
                                        {product.title}
                                    </ThemedText>
                                    <ThemedText
                                        numberOfLines={1}
                                        style={styles.searchSuggestionMeta}
                                    >
                                        {product.category}
                                    </ThemedText>
                                </View>
                                <ThemedText style={styles.searchSuggestionPrice}>
                                    {product.price} TMT
                                </ThemedText>
                            </TouchableOpacity>
                        ))
                    )}
                    {suggestions.length ? (
                        <TouchableOpacity
                            activeOpacity={0.84}
                            style={styles.searchSuggestionAll}
                            onPress={onSubmitSearch}
                        >
                            <ThemedText style={styles.searchSuggestionAllText}>
                                {t("showAllResults")}
                            </ThemedText>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}

            <TouchableOpacity
                activeOpacity={0.84}
                style={styles.brandsButton}
                onPress={onOpenBrands}
            >
                <ThemedText style={styles.brandsButtonText}>{t("brands")}</ThemedText>
            </TouchableOpacity>
        </View>
    );
}

function getBrandLetter(name: string) {
    const firstLetter = name.trim()[0]?.toUpperCase() || "#";

    if (/[A-Z]/.test(firstLetter)) return firstLetter;
    if (/[А-ЯЁ]/.test(firstLetter)) return firstLetter;
    return "#";
}

const LATIN_BRAND_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const CYRILLIC_BRAND_LETTERS = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("");
const BRAND_LETTERS = [...LATIN_BRAND_LETTERS, ...CYRILLIC_BRAND_LETTERS];

export function BrandsPanel({
    brands,
    loading,
    onBack,
    onSelectBrand,
    refreshing = false,
    onRefresh,
}: {
    brands: BrandItem[];
    loading: boolean;
    onBack: () => void;
    onSelectBrand: (brand: BrandItem) => void;
    refreshing?: boolean;
    onRefresh?: () => void;
}) {
    const t = useTranslations();
    const grouped = brands.reduce<Record<string, BrandItem[]>>(
        (accumulator, brand) => {
            const letter = getBrandLetter(brand.name);
            accumulator[letter] = accumulator[letter] || [];
            accumulator[letter].push(brand);
            return accumulator;
        },
        {}
    );

    const letters = Object.keys(grouped).sort((first, second) => {
        const firstIndex = BRAND_LETTERS.indexOf(first);
        const secondIndex = BRAND_LETTERS.indexOf(second);

        if (firstIndex === -1 && secondIndex === -1) {
            return first.localeCompare(second);
        }
        if (firstIndex === -1) return 1;
        if (secondIndex === -1) return -1;
        return firstIndex - secondIndex;
    });

    const sections = letters.map((letter) => ({
        title: letter,
        data: grouped[letter],
    }));

    if (loading) {
        return (
            <View style={styles.brandsScreen}>
                <View style={[styles.brandsHeader, styles.brandsFixedHeader]}>
                    <TouchableOpacity
                        activeOpacity={0.82}
                        style={styles.brandsBack}
                        onPress={onBack}
                    >
                        <ArrowLeft
                            color={palette.primary}
                            size={21}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>
                    <ThemedText style={styles.brandsTitle}>{t("brands")}</ThemedText>
                </View>
                <View style={styles.inlineLoader}>
                    <ActivityIndicator color={palette.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.brandsScreen}>
            <View style={[styles.brandsHeader, styles.brandsFixedHeader]}>
                <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.brandsBack}
                    onPress={onBack}
                >
                    <ArrowLeft
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.2}
                    />
                </TouchableOpacity>
                <ThemedText style={styles.brandsTitle}>{t("brands")}</ThemedText>
            </View>
            <SectionList
                style={styles.brandsList}
                sections={sections}
                keyExtractor={(item) => String(item.id)}
                stickySectionHeadersEnabled={false}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={palette.primary}
                            colors={[palette.primary]}
                        />
                    ) : undefined
                }
                contentContainerStyle={styles.brandsPanel}
                initialNumToRender={24}
                maxToRenderPerBatch={24}
                windowSize={9}
                renderSectionHeader={({ section }) => (
                    <ThemedText style={styles.brandLetter}>
                        {section.title}
                    </ThemedText>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.82}
                        style={styles.brandItem}
                        onPress={() => onSelectBrand(item)}
                    >
                        <ThemedText style={styles.brandName}>
                            {item.name}
                        </ThemedText>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

}

export function ProductCard({ product }: { product: ProductItem }) {
    const t = useTranslations();
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
                        cachePolicy="memory-disk"
                        recyclingKey={`product-${product.id}`}
                        contentFit="contain"
                        style={styles.productImage}
                    />
                ) : (
                    <ThemedText style={styles.imageFallback}>
                        {t("noImage")}
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
                    {t("addToCart")}
                </ThemedText>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

export function ProductGrid({ items }: { items: ProductItem[] }) {
    const t = useTranslations();
    if (!items.length) {
        return (
            <ThemedText style={styles.emptyText}>
                {t("emptyCategory")}
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
    const t = useTranslations();

    return (
        <View style={styles.feedStatus}>
            <ThemedText style={styles.feedStatusText}>
            {loading
                    ? t("loadingMore")
                    : hasMore
                      ? t("scrollMore")
                      : t("allProductsLoaded")}
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
    onReset?: () => void;
}) {
    const t = useTranslations();

    return (
        <View style={styles.activeResults}>
            <SectionHeader
                title={title}
                action={onReset ? t("reset") : undefined}
                onAction={onReset}
            />
            {loading ? (
                <ProductGridSkeleton count={4} />
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

export function WhatsNewCard({ onOpenSale }: { onOpenSale: () => void }) {
    const t = useTranslations();

    return (
        <View style={styles.whatsNew}>
            <View style={styles.whatsNewText}>
                <ThemedText style={styles.whatsNewLabel}>
                    {t("sale")}
                </ThemedText>
                <ThemedText numberOfLines={2} style={styles.whatsNewBody}>
                    {t("saleMarkedProducts")}
                </ThemedText>
            </View>
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.whatsNewButton}
                onPress={onOpenSale}
            >
                <ThemedText style={styles.whatsNewButtonText}>
                    {t("open")}
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
}

export function LoadingCard() {
    return <HomeSkeleton />;
}

export function ErrorCard({ onRetry }: { onRetry: () => void }) {
    const t = useTranslations();

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={styles.errorCard}
            onPress={onRetry}
        >
            <ThemedText style={styles.errorTitle}>
                {t("errorLoadData")}
            </ThemedText>
            <ThemedText style={styles.errorText}>
                {t("retryHint")}
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
            {promotions.map((slide) => {
                const canOpen = isPromotionOpenable(slide);

                return (
                    <TouchableOpacity
                        activeOpacity={0.86}
                        disabled={!canOpen}
                        key={slide.id}
                        style={[
                            styles.heroCard,
                            !canOpen ? styles.heroCardDisabled : null,
                        ]}
                        onPress={() => openPromotion(slide)}
                    >
                        {slide.image ? (
                            <Image
                                source={{ uri: slide.image }}
                                cachePolicy="memory-disk"
                                recyclingKey={`promo-${slide.id}`}
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
                );
            })}
        </ScrollView>
    );
}

export function ProductSection({
    title,
    products,
    action,
    onAction,
    children,
}: {
    title: string;
    products: ProductItem[];
    action?: string;
    onAction?: () => void;
    children?: ReactNode;
}) {
    if (!products.length) {
        return null;
    }

    return (
        <View style={styles.section}>
            <SectionHeader title={title} action={action} onAction={onAction} />
            <ProductGrid items={products} />
            {children}
        </View>
    );
}
