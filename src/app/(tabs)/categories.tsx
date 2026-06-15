import { useNetInfo } from "@react-native-community/netinfo";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    DeviceEventEmitter,
    FlatList,
    ListRenderItemInfo,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OfflineBanner } from "@/components/offline-banner";
import { ProductGridSkeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { palette, styles } from "@/features/categories/categories.styles";
import { FeedStatus, ProductCard } from "@/features/home/components";
import { useTranslations } from "@/i18n";
import {
    CategoryItem,
    getCategories,
    getPagedProducts,
    ProductItem,
} from "@/services/catalog";
import { getCacheMeta } from "@/services/cache";
import { useLanguageStore } from "@/store/language";

const PAGE_SIZE = 10;

function getProductsCacheKey({
    categoryId,
    ordering,
    minPrice,
    maxPrice,
    hasDiscount,
    page,
}: {
    categoryId: number;
    ordering: string;
    minPrice: string;
    maxPrice: string;
    hasDiscount: boolean;
    page: number;
}) {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("page_size", String(PAGE_SIZE));
    params.append("in_stock", "true");
    params.append("category", String(categoryId));
    params.append("ordering", ordering);
    if (minPrice.trim()) params.append("min_price", minPrice.trim());
    if (maxPrice.trim()) params.append("max_price", maxPrice.trim());
    if (hasDiscount) params.append("has_discount", "true");
    return `products:/products/?${params.toString()}`;
}

function getCategoryPath(category: CategoryItem, categories: CategoryItem[]) {
    const path: CategoryItem[] = [];
    let current: CategoryItem | undefined = category;

    while (current) {
        path.unshift(current);
        current = current.parent
            ? categories.find((item) => item.id === current?.parent)
            : undefined;
    }

    return path;
}

export default function CategoriesScreen() {
    const netInfo = useNetInfo();
    const t = useTranslations();
    const language = useLanguageStore((state) => state.language);
    const listRef = useRef<FlatList<ProductItem>>(null);
    const productsLoadingRef = useRef(false);
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const routeParams = useLocalSearchParams<{
        categoryId?: string;
        discountOnly?: string;
    }>();
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [selectedCategory, setSelectedCategory] =
        useState<CategoryItem | null>(null);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsHasMore, setProductsHasMore] = useState(true);
    const [ordering, setOrdering] = useState("-created_at");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [discountOnly, setDiscountOnly] = useState(false);
    const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | null>(null);
    const isOffline =
        netInfo.isConnected === false || netInfo.isInternetReachable === false;
    const sortOptions = [
        { label: t("sortNewest"), value: "-created_at" },
        { label: t("sortCheap"), value: "real_price" },
        { label: t("sortExpensive"), value: "-real_price" },
    ];

    const scrollToTop = useCallback((animated = true) => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
        requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated });
        });
        setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated });
        }, 120);
        setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated });
        }, 320);
    }, [language]);

    useFocusEffect(
        useCallback(() => {
            if (routeParams.categoryId || routeParams.discountOnly) {
                scrollToTop(false);
            }
        }, [routeParams.categoryId, routeParams.discountOnly, scrollToTop])
    );

    useEffect(() => {
        let alive = true;

        async function loadCategories() {
            try {
                setLoading(true);
                const data = await getCategories();
                if (!alive) return;

                setCategories(data);
                const meta = await getCacheMeta("categories");
                if (alive) setCacheUpdatedAt(meta?.savedAt || null);
            } finally {
                if (alive) setLoading(false);
            }
        }

        loadCategories();
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (!categories.length) return;

        const routeCategoryId = Number(routeParams.categoryId);
        const routeDiscountOnly = routeParams.discountOnly === "true";

        if (routeDiscountOnly) {
            setDiscountOnly(true);
        }

        scrollToTop(false);

        if (!Number.isFinite(routeCategoryId) || routeCategoryId <= 0) {
            return;
        }

        const routeCategory = categories.find(
            (category) => category.id === routeCategoryId
        );

        if (routeCategory && selectedCategory?.id !== routeCategory.id) {
            setSelectedCategory(routeCategory);
            setProducts([]);
        }
    }, [
        categories,
        routeParams.categoryId,
        routeParams.discountOnly,
        selectedCategory?.id,
        scrollToTop,
    ]);

    const loadProductsPage = useCallback(
        async ({ reset = false }: { reset?: boolean } = {}) => {
            if (!selectedCategory) {
                setProducts([]);
                setProductsLoading(false);
                setProductsHasMore(false);
                return;
            }

            if (
                productsLoadingRef.current ||
                (!hasMoreRef.current && !reset)
            ) {
                return;
            }

            const nextPage = reset ? 1 : pageRef.current;

            try {
                productsLoadingRef.current = true;
                setProductsLoading(true);
                const data = await getPagedProducts({
                    page: nextPage,
                    pageSize: PAGE_SIZE,
                    categoryId: selectedCategory.id,
                    ordering,
                    minPrice,
                    maxPrice,
                    hasDiscount: discountOnly,
                });

                setProducts((previous) => {
                    const base = reset ? [] : previous;
                    const existingIds = new Set(
                        base.map((product) => product.id)
                    );
                    return [
                        ...base,
                        ...data.filter(
                            (product) => !existingIds.has(product.id)
                        ),
                    ];
                });

                pageRef.current = nextPage + 1;
                hasMoreRef.current = data.length >= PAGE_SIZE;
                setProductsHasMore(hasMoreRef.current);

                const metas = await Promise.all([
                    getCacheMeta("categories"),
                    getCacheMeta(
                        getProductsCacheKey({
                            categoryId: selectedCategory.id,
                            ordering,
                            minPrice,
                            maxPrice,
                            hasDiscount: discountOnly,
                            page: nextPage,
                        })
                    ),
                ]);
                const dates = metas
                    .map((meta) => meta?.savedAt)
                    .filter((date): date is string => Boolean(date))
                    .sort();
                if (dates.length) {
                    setCacheUpdatedAt(dates[dates.length - 1]);
                }
            } finally {
                productsLoadingRef.current = false;
                setProductsLoading(false);
            }
        },
        [selectedCategory, ordering, minPrice, maxPrice, discountOnly]
    );

    useEffect(() => {
        pageRef.current = 1;
        hasMoreRef.current = true;
        setProductsHasMore(true);
        setProducts([]);
        loadProductsPage({ reset: true });
    }, [loadProductsPage]);

    const currentLevelCategories = selectedCategory
        ? categories.filter((category) => category.parent === selectedCategory.id)
        : categories.filter((category) => !category.parent);
    const parentCategory = selectedCategory?.parent
        ? categories.find((category) => category.id === selectedCategory.parent) ||
          null
        : null;
    const categoryPath = selectedCategory
        ? getCategoryPath(selectedCategory, categories)
        : [];

    function selectCategory(category: CategoryItem) {
        if (selectedCategory?.id === category.id) return;

        setSelectedCategory(category);
        setProducts([]);
        scrollToTop(true);
    }

    function goBackLevel() {
        setSelectedCategory(parentCategory);
        setProducts([]);
        scrollToTop(true);
    }

    function resetToRoot() {
        setSelectedCategory(null);
        setProducts([]);
        setOrdering("-created_at");
        setMinPrice("");
        setMaxPrice("");
        setDiscountOnly(false);
        scrollToTop(true);
    }

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(
            "categoriesTabPressed",
            resetToRoot
        );

        return () => subscription.remove();
    }, [scrollToTop]);

    function resetFilters() {
        setOrdering("-created_at");
        setMinPrice("");
        setMaxPrice("");
        setDiscountOnly(false);
    }

    function renderProduct({ item }: ListRenderItemInfo<ProductItem>) {
        return <ProductCard product={item} />;
    }

    function renderFooter() {
        if (!selectedCategory) return null;

        return (
            <View style={styles.productsFooter}>
                <FeedStatus
                    loading={productsLoading}
                    hasMore={productsHasMore}
                />
            </View>
        );
    }

    function renderEmptyProducts() {
        if (!selectedCategory || productsLoading) return null;

        return (
            <ThemedText style={styles.emptyText}>
                {t("emptyCategory")}
            </ThemedText>
        );
    }

    return (
        <SafeAreaView edges={["top"]} style={styles.root}>
            <FlatList
                ref={listRef}
                data={selectedCategory ? products : []}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderProduct}
                numColumns={2}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                columnWrapperStyle={styles.productColumn}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={7}
                removeClippedSubviews
                onEndReached={() => loadProductsPage()}
                onEndReachedThreshold={0.55}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmptyProducts}
                ListHeaderComponent={
                    <>
                <View style={styles.header}>
                    <ThemedText style={styles.title}>{t("categories")}</ThemedText>
                    <ThemedText style={styles.subtitle}>
                        {t("chooseCategory")}
                    </ThemedText>
                </View>

                <OfflineBanner
                    visible={isOffline}
                    updatedAt={cacheUpdatedAt}
                />

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color={palette.primary} />
                    </View>
                ) : (
                    <>
                        <View style={styles.categoryPanel}>
                            <View style={styles.categoryLevelCard}>
                                <ThemedText
                                    numberOfLines={1}
                                    style={styles.categoryTrail}
                                >
                                    {categoryPath.length
                                        ? [t("categories"), ...categoryPath.map(
                                              (item) => item.title
                                          )].join(" / ")
                                        : t("categories")}
                                </ThemedText>
                                <View style={styles.categoryLevelHeader}>
                                    <View style={styles.categoryLevelText}>
                                        <ThemedText
                                            style={styles.categoryLevelTitle}
                                        >
                                            {selectedCategory
                                                ? selectedCategory.title
                                                : t("mainCategories")}
                                        </ThemedText>
                                        <ThemedText
                                            style={styles.categoryLevelMeta}
                                        >
                                            {currentLevelCategories.length
                                                ? selectedCategory
                                                    ? t("selectSubcategory")
                                                    : t("selectSection")
                                                : t("inCategoryProducts")}
                                        </ThemedText>
                                    </View>
                                    
                                </View>
                            </View>

                            {currentLevelCategories.length ? (
                                <View style={styles.categoryList}>
                                    {currentLevelCategories.map((category) => (
                                        <TouchableOpacity
                                            activeOpacity={0.84}
                                            key={category.id}
                                            style={styles.categoryRow}
                                            onPress={() =>
                                                selectCategory(category)
                                            }
                                        >
                                            <View style={styles.categoryRowCopy}>
                                                <ThemedText
                                                    style={
                                                        styles.categoryRowText
                                                    }
                                                >
                                                    {category.title}
                                                </ThemedText>
                                                <ThemedText
                                                    style={
                                                        styles.categoryRowMeta
                                                    }
                                                >
                                                    {t("openCategory")}
                                                </ThemedText>
                                            </View>
                                            <View style={styles.categoryArrow}>
                                                <ChevronRight
                                                    color={palette.primary}
                                                    size={18}
                                                    strokeWidth={2.3}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.noSubcategories}>
                                    <ThemedText
                                        style={styles.noSubcategoriesText}
                                    >
                                        {t("noMoreSubcategories")}
                                    </ThemedText>
                                </View>
                            )}
                        </View>

                        {selectedCategory ? (
                            <>
                                <View style={styles.filtersPanel}>
                            <View style={styles.filtersHeader}>
                                <ThemedText style={styles.filtersTitle}>
                                    {t("filters")}
                                </ThemedText>
                                <TouchableOpacity
                                    hitSlop={8}
                                    onPress={resetFilters}
                                >
                                    <ThemedText style={styles.resetText}>
                                        {t("reset")}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                horizontal
                                nestedScrollEnabled
                                keyboardShouldPersistTaps="handled"
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.sortList}
                            >
                                {sortOptions.map((option) => {
                                    const isActive = ordering === option.value;
                                    return (
                                        <TouchableOpacity
                                            activeOpacity={0.82}
                                            key={option.value}
                                            style={[
                                                styles.sortChip,
                                                isActive &&
                                                    styles.sortChipActive,
                                            ]}
                                            onPress={() =>
                                                setOrdering(option.value)
                                            }
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.sortText,
                                                    isActive &&
                                                        styles.sortTextActive,
                                                ]}
                                            >
                                                {option.label}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <View style={styles.priceFilterRow}>
                                <TextInput
                                    value={minPrice}
                                    onChangeText={setMinPrice}
                                    keyboardType="numeric"
                                    placeholder={t("priceFrom")}
                                    placeholderTextColor={palette.secondary}
                                    style={styles.priceInput}
                                />
                                <TextInput
                                    value={maxPrice}
                                    onChangeText={setMaxPrice}
                                    keyboardType="numeric"
                                    placeholder={t("priceTo")}
                                    placeholderTextColor={palette.secondary}
                                    style={styles.priceInput}
                                />
                                <TouchableOpacity
                                    activeOpacity={0.82}
                                    style={[
                                        styles.discountChip,
                                        discountOnly &&
                                            styles.discountChipActive,
                                    ]}
                                    onPress={() =>
                                        setDiscountOnly((value) => !value)
                                    }
                                >
                                    <ThemedText
                                        style={[
                                            styles.discountText,
                                            discountOnly &&
                                                styles.discountTextActive,
                                        ]}
                                    >
                                        {t("discount")}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                                </View>

                                <ThemedText style={styles.sectionTitle}>
                                    {selectedCategory.title}
                                </ThemedText>
                                {productsLoading && !products.length ? (
                                    <ProductGridSkeleton count={6} />
                                ) : null}
                            </>
                        ) : null}
                    </>
                )}
                    </>
                }
            />
            <View pointerEvents="box-none" style={styles.fixedBackBar}>
                <TouchableOpacity
                    activeOpacity={0.84}
                    style={styles.backButton}
                    onPress={selectedCategory ? goBackLevel : resetToRoot}
                >
                    <ArrowLeft
                        color={palette.primary}
                        size={19}
                        strokeWidth={2.2}
                    />
                    <ThemedText style={styles.backButtonText}>
                        {selectedCategory ? t("back") : t("mainCategories")}
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
