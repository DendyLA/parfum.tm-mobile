import { useNetInfo } from "@react-native-community/netinfo";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
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
import { ProductGrid } from "@/features/home/components";
import {
    CategoryItem,
    getCategories,
    getPagedProducts,
    ProductItem,
} from "@/services/catalog";
import { getCacheMeta } from "@/services/cache";

const SORT_OPTIONS = [
    { label: "Сначала новые", value: "-created_at" },
    { label: "Дешевле", value: "real_price" },
    { label: "Дороже", value: "-real_price" },
];

function getProductsCacheKey({
    categoryId,
    ordering,
    minPrice,
    maxPrice,
    hasDiscount,
}: {
    categoryId: number;
    ordering: string;
    minPrice: string;
    maxPrice: string;
    hasDiscount: boolean;
}) {
    const params = new URLSearchParams();
    params.append("page", "1");
    params.append("page_size", "20");
    params.append("in_stock", "true");
    params.append("category", String(categoryId));
    params.append("ordering", ordering);
    if (minPrice.trim()) params.append("min_price", minPrice.trim());
    if (maxPrice.trim()) params.append("max_price", maxPrice.trim());
    if (hasDiscount) params.append("has_discount", "true");
    return `products:/products/?${params.toString()}`;
}

export default function CategoriesScreen() {
    const netInfo = useNetInfo();
    const scrollRef = useRef<ScrollView>(null);
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
    const [ordering, setOrdering] = useState("-created_at");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [discountOnly, setDiscountOnly] = useState(false);
    const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | null>(null);
    const isOffline =
        netInfo.isConnected === false || netInfo.isInternetReachable === false;

    const scrollToTop = useCallback((animated = true) => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ y: 0, animated });
        });
        setTimeout(() => {
            scrollRef.current?.scrollTo({ y: 0, animated });
        }, 120);
        setTimeout(() => {
            scrollRef.current?.scrollTo({ y: 0, animated });
        }, 320);
    }, []);

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
                const firstParent =
                    data.find((category) => !category.parent) || null;
                setSelectedCategory(firstParent);
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

    useEffect(() => {
        let alive = true;

        async function loadProducts() {
            if (!selectedCategory) return;

            try {
                setProductsLoading(true);
                const data = await getPagedProducts({
                    page: 1,
                    pageSize: 20,
                    categoryId: selectedCategory.id,
                    ordering,
                    minPrice,
                    maxPrice,
                    hasDiscount: discountOnly,
                });
                if (alive) setProducts(data);
                const metas = await Promise.all([
                    getCacheMeta("categories"),
                    getCacheMeta(
                        getProductsCacheKey({
                            categoryId: selectedCategory.id,
                            ordering,
                            minPrice,
                            maxPrice,
                            hasDiscount: discountOnly,
                        })
                    ),
                ]);
                const dates = metas
                    .map((meta) => meta?.savedAt)
                    .filter((date): date is string => Boolean(date))
                    .sort();
                if (alive && dates.length) {
                    setCacheUpdatedAt(dates[dates.length - 1]);
                }
            } finally {
                if (alive) setProductsLoading(false);
            }
        }

        loadProducts();
        return () => {
            alive = false;
        };
    }, [selectedCategory, ordering, minPrice, maxPrice, discountOnly]);

    const parentCategories = categories.filter((category) => !category.parent);
    const selectedParentId =
        selectedCategory?.parent || selectedCategory?.id || null;
    const childCategories = selectedParentId
        ? categories.filter((category) => category.parent === selectedParentId)
        : [];

    function selectCategory(category: CategoryItem) {
        if (selectedCategory?.id === category.id) return;

        setSelectedCategory(category);
        setProducts([]);
        scrollToTop(true);
    }

    function resetFilters() {
        setOrdering("-created_at");
        setMinPrice("");
        setMaxPrice("");
        setDiscountOnly(false);
    }

    return (
        <SafeAreaView edges={["top"]} style={styles.root}>
            <ScrollView
                ref={scrollRef}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>
                    <ThemedText style={styles.title}>Категории</ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Выбирайте раздел и сразу смотрите товары
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
                        <ScrollView
                            horizontal
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.parentList}
                        >
                            {parentCategories.map((category) => {
                                const isActive =
                                    selectedParentId === category.id;
                                return (
                                    <TouchableOpacity
                                        activeOpacity={0.82}
                                        key={category.id}
                                        style={[
                                            styles.parentChip,
                                            isActive && styles.parentChipActive,
                                        ]}
                                        onPress={() => selectCategory(category)}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.parentText,
                                                isActive &&
                                                    styles.parentTextActive,
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
                                    horizontal
                                    nestedScrollEnabled
                                    keyboardShouldPersistTaps="handled"
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={
                                        styles.subcategoryList
                                    }
                                >
                                    {childCategories.map((category) => {
                                        const isActive =
                                            selectedCategory?.id ===
                                            category.id;
                                        return (
                                            <TouchableOpacity
                                                activeOpacity={0.82}
                                                key={category.id}
                                                style={[
                                                    styles.subcategoryChip,
                                                    isActive &&
                                                        styles.subcategoryChipActive,
                                                ]}
                                                onPress={() =>
                                                    selectCategory(category)
                                                }
                                            >
                                                <ThemedText
                                                    style={
                                                        styles.subcategoryText
                                                    }
                                                >
                                                    {category.title}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        ) : null}

                        <View style={styles.filtersPanel}>
                            <View style={styles.filtersHeader}>
                                <ThemedText style={styles.filtersTitle}>
                                    Фильтры
                                </ThemedText>
                                <TouchableOpacity
                                    hitSlop={8}
                                    onPress={resetFilters}
                                >
                                    <ThemedText style={styles.resetText}>
                                        Сбросить
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
                                {SORT_OPTIONS.map((option) => {
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
                                    placeholder="Цена от"
                                    placeholderTextColor={palette.secondary}
                                    style={styles.priceInput}
                                />
                                <TextInput
                                    value={maxPrice}
                                    onChangeText={setMaxPrice}
                                    keyboardType="numeric"
                                    placeholder="Цена до"
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
                                        Скидки
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ThemedText style={styles.sectionTitle}>
                            {selectedCategory?.title || "Товары"}
                        </ThemedText>
                        {productsLoading ? (
                            <ProductGridSkeleton count={6} />
                        ) : products.length ? (
                            <ProductGrid items={products} />
                        ) : (
                            <ThemedText style={styles.emptyText}>
                                В этой категории пока нет товаров
                            </ThemedText>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
