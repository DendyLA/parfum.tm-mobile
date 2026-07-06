import { useNetInfo } from "@react-native-community/netinfo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    BackHandler,
    DeviceEventEmitter,
    RefreshControl,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OfflineBanner } from "@/components/offline-banner";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
    ActiveResults,
    BrandsPanel,
    ErrorCard,
    FeedStatus,
    HomeHeader,
    LoadingCard,
    ProductSection,
    PromoCarousel,
    SearchCategoryBar,
    WhatsNewCard,
} from "@/features/home/components";
import { palette, styles } from "@/features/home/home.styles";
import { HomeData } from "@/features/home/types";
import {
    CategoryItem,
    BrandItem,
    getBrands,
    getHomeCatalog,
    getPagedProducts,
    ProductItem,
    searchCatalog,
} from "@/services/catalog";
import { getCacheMeta } from "@/services/cache";
import { useLanguageStore } from "@/store/language";
import { useTranslations } from "@/i18n";

const PAGE_SIZE = 10;

export default function HomeScreen() {
    const netInfo = useNetInfo();
    const router = useRouter();
    const language = useLanguageStore((state) => state.language);
    const t = useTranslations();
    const brandSortOptions = [
        { label: t("sortNewest"), value: "-created_at" },
        { label: t("sortCheap"), value: "real_price" },
        { label: t("sortExpensive"), value: "-real_price" },
    ];
    const scrollRef = useRef<ScrollView>(null);
    const languageReadyRef = useRef(false);
    const [homeData, setHomeData] = useState<HomeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedCategory, setSelectedCategory] =
        useState<CategoryItem | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
    const [saleOnly, setSaleOnly] = useState(false);
    const [newOnly, setNewOnly] = useState(false);
    const [recommendedOnly, setRecommendedOnly] = useState(false);
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [brandsLoading, setBrandsLoading] = useState(false);
    const [showBrands, setShowBrands] = useState(false);
    const [brandOrdering, setBrandOrdering] = useState("-created_at");
    const [brandMinPrice, setBrandMinPrice] = useState("");
    const [brandMaxPrice, setBrandMaxPrice] = useState("");
    const [brandDiscountOnly, setBrandDiscountOnly] = useState(false);
    const [categoryLoading, setCategoryLoading] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [searchProducts, setSearchProducts] = useState<ProductItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<ProductItem[]>(
        []
    );
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    const [feedProducts, setFeedProducts] = useState<ProductItem[]>([]);
    const [feedPage, setFeedPage] = useState(1);
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedHasMore, setFeedHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
        }, 80);
        setTimeout(() => {
            scrollRef.current?.scrollTo({ y: 0, animated });
        }, 240);
    }, []);

    const resetToHomeFeed = useCallback(
        (animated = true) => {
            setShowBrands(false);
            setSelectedBrand(null);
            setSelectedCategory(null);
            setSaleOnly(false);
            setNewOnly(false);
            setRecommendedOnly(false);
            setActiveSearch("");
            setSearchText("");
            setSearchProducts([]);
            setSearchSuggestions([]);
            setFeedProducts(homeData?.special || []);
            setFeedPage(2);
            setFeedHasMore((homeData?.special.length || 0) >= 8);
            scrollToTop(animated);
        },
        [homeData?.special, scrollToTop]
    );

    async function loadHome() {
        try {
            setLoading(true);
            setError(null);

            const data = await getHomeCatalog();
            setHomeData(data);
            setFeedProducts(data.special);
            setFeedPage(2);
            setFeedHasMore(data.special.length >= 8);
            refreshCacheMeta();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : t("errorLoadHome")
            );
        } finally {
            setLoading(false);
        }
    }

    async function refreshCacheMeta() {
        const metas = await Promise.all([
            getCacheMeta("current-promotion"),
            getCacheMeta("promotions"),
            getCacheMeta("categories"),
            getCacheMeta("products:/products/?page_size=8&in_stock=true"),
        ]);
        const dates = metas
            .map((meta) => meta?.savedAt)
            .filter((date): date is string => Boolean(date))
            .sort();

        setCacheUpdatedAt(dates.length ? dates[dates.length - 1] : null);
    }

    useEffect(() => {
        loadHome();
    }, []);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(
            "homeTabPressed",
            () => resetToHomeFeed(true)
        );

        return () => subscription.remove();
    }, [resetToHomeFeed]);

    useFocusEffect(
        useCallback(() => {
            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                () => {
                    if (selectedBrand) {
                        setSelectedBrand(null);
                        setFeedProducts([]);
                        setFeedPage(1);
                        setFeedHasMore(true);
                        resetBrandFilters();
                        setShowBrands(true);
                        scrollToTop(false);
                        return true;
                    }

                    if (showBrands) {
                        setShowBrands(false);
                        scrollToTop(false);
                        return true;
                    }

                    if (
                        selectedCategory ||
                        activeSearch ||
                        saleOnly ||
                        newOnly ||
                        recommendedOnly
                    ) {
                        resetToHomeFeed(true);
                        return true;
                    }

                    return false;
                }
            );

            return () => subscription.remove();
        }, [
            activeSearch,
            newOnly,
            recommendedOnly,
            resetToHomeFeed,
            saleOnly,
            scrollToTop,
            selectedBrand,
            selectedCategory,
            showBrands,
        ])
    );

    useEffect(() => {
        const query = searchText.trim();

        if (query.length < 2 || query === activeSearch) {
            setSearchSuggestions([]);
            setSuggestionsLoading(false);
            return;
        }

        let alive = true;
        const timer = setTimeout(async () => {
            try {
                setSuggestionsLoading(true);
                const results = await searchCatalog(query, 3);
                if (alive) setSearchSuggestions(results.slice(0, 3));
            } catch {
                if (alive) setSearchSuggestions([]);
            } finally {
                if (alive) setSuggestionsLoading(false);
            }
        }, 260);

        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [activeSearch, searchText]);

    const categories = homeData?.categories || [];
    const parentCategories = categories.filter((category) => !category.parent);
    const selectedParentId =
        selectedCategory?.parent || selectedCategory?.id || null;
    const childCategories = selectedParentId
        ? categories.filter((category) => category.parent === selectedParentId)
        : [];
    const hasActiveFilter = Boolean(
        selectedCategory ||
            selectedBrand ||
            activeSearch ||
            saleOnly ||
            newOnly ||
            recommendedOnly
    );

    async function loadFeed({
        reset = false,
        categoryId = selectedCategory?.id || null,
        brandId = selectedBrand?.id || null,
        discountOnly = saleOnly,
        onlyNew = newOnly,
        onlyRecommended = recommendedOnly,
    }: {
        reset?: boolean;
        categoryId?: number | null;
        brandId?: number | null;
        discountOnly?: boolean;
        onlyNew?: boolean;
        onlyRecommended?: boolean;
    } = {}) {
        if (feedLoading || (!feedHasMore && !reset) || activeSearch) return;

        const nextPage = reset ? 1 : feedPage;
        try {
            setFeedLoading(true);
            const data = await getPagedProducts({
                page: nextPage,
                pageSize: PAGE_SIZE,
                categoryId,
                brandId,
                ordering: brandId ? brandOrdering : undefined,
                minPrice: brandId ? brandMinPrice : undefined,
                maxPrice: brandId ? brandMaxPrice : undefined,
                hasDiscount: brandId ? brandDiscountOnly : false,
                onSale: brandId ? false : discountOnly,
                isNew: onlyNew,
                isRecommended: onlyRecommended,
            });
            const visibleData = brandId
                ? data.filter((product) => product.brandId === brandId)
                : data;

            setFeedProducts((previous) => {
                const base = reset ? [] : previous;
                const existingIds = new Set(base.map((product) => product.id));
                return [
                    ...base,
                    ...visibleData.filter(
                        (product) => !existingIds.has(product.id)
                    ),
                ];
            });

            setFeedPage(nextPage + 1);
            setFeedHasMore(data.length >= PAGE_SIZE);
        } finally {
            setFeedLoading(false);
        }
    }

    async function selectCategory(category: CategoryItem | null) {
        if (
            (selectedCategory?.id || null) === (category?.id || null) &&
            !activeSearch &&
            !saleOnly &&
            !newOnly &&
            !recommendedOnly
        )
            return;

        setSelectedCategory(category);
        setSelectedBrand(null);
        setSaleOnly(false);
        setNewOnly(false);
        setRecommendedOnly(false);
        setActiveSearch("");
        setSearchText("");
        setSearchProducts([]);
        setSearchSuggestions([]);
        setFeedProducts([]);
        setFeedPage(1);
        setFeedHasMore(true);
        scrollToTop(true);

        if (!category) {
            loadFeed({ reset: true, categoryId: null });
            return;
        }

        try {
            setCategoryLoading(true);
            const data = await getPagedProducts({
                page: 1,
                pageSize: PAGE_SIZE,
                categoryId: category.id,
            });
            setFeedProducts(data);
            setFeedPage(2);
            setFeedHasMore(data.length >= PAGE_SIZE);
        } finally {
            setCategoryLoading(false);
        }
    }

    async function submitSearch() {
        const query = searchText.trim();
        if (!query) return;

        setSelectedCategory(null);
        setSelectedBrand(null);
        setSaleOnly(false);
        setNewOnly(false);
        setRecommendedOnly(false);
        setFeedProducts([]);
        setFeedHasMore(false);
        setActiveSearch(query);
        setSearchSuggestions([]);
        scrollToTop(true);

        try {
            setSearchLoading(true);
            setSearchProducts(await searchCatalog(query));
        } finally {
            setSearchLoading(false);
        }
    }

    function clearSearch() {
        setSearchText("");
        setActiveSearch("");
        setSearchProducts([]);
        setSearchSuggestions([]);
        setFeedHasMore(true);
        setSaleOnly(false);
        setNewOnly(false);
        setRecommendedOnly(false);
        loadFeed({ reset: true, categoryId: selectedCategory?.id || null });
    }

    async function openSaleProducts() {
        setShowBrands(false);
        setSelectedBrand(null);
        setSelectedCategory(null);
        setSaleOnly(true);
        setNewOnly(false);
        setRecommendedOnly(false);
        setActiveSearch("");
        setSearchText("");
        setSearchProducts([]);
        setSearchSuggestions([]);
        setFeedProducts([]);
        setFeedPage(1);
        setFeedHasMore(true);
        scrollToTop(true);

        try {
            setCategoryLoading(true);
            const data = await getPagedProducts({
                page: 1,
                pageSize: PAGE_SIZE,
                onSale: true,
            });
            setFeedProducts(data);
            setFeedPage(2);
            setFeedHasMore(data.length >= PAGE_SIZE);
        } finally {
            setCategoryLoading(false);
        }
    }

    async function openNewProducts() {
        setShowBrands(false);
        setSelectedBrand(null);
        setSelectedCategory(null);
        setSaleOnly(false);
        setNewOnly(true);
        setRecommendedOnly(false);
        setActiveSearch("");
        setSearchText("");
        setSearchProducts([]);
        setSearchSuggestions([]);
        setFeedProducts([]);
        setFeedPage(1);
        setFeedHasMore(true);
        scrollToTop(true);

        try {
            setCategoryLoading(true);
            const data = await getPagedProducts({
                page: 1,
                pageSize: PAGE_SIZE,
                isNew: true,
            });
            setFeedProducts(data);
            setFeedPage(2);
            setFeedHasMore(data.length >= PAGE_SIZE);
        } finally {
            setCategoryLoading(false);
        }
    }

    async function openRecommendedProducts() {
        setShowBrands(false);
        setSelectedBrand(null);
        setSelectedCategory(null);
        setSaleOnly(false);
        setNewOnly(false);
        setRecommendedOnly(true);
        setActiveSearch("");
        setSearchText("");
        setSearchProducts([]);
        setSearchSuggestions([]);
        setFeedProducts([]);
        setFeedPage(1);
        setFeedHasMore(true);
        scrollToTop(true);

        try {
            setCategoryLoading(true);
            const data = await getPagedProducts({
                page: 1,
                pageSize: PAGE_SIZE,
                isRecommended: true,
            });
            setFeedProducts(data);
            setFeedPage(2);
            setFeedHasMore(data.length >= PAGE_SIZE);
        } finally {
            setCategoryLoading(false);
        }
    }

    async function openBrands() {
        setShowBrands(true);
        setSaleOnly(false);
        setNewOnly(false);
        setRecommendedOnly(false);
        setActiveSearch("");
        setSearchText("");
        setSearchProducts([]);
        setSearchSuggestions([]);
        scrollToTop(false);
        requestAnimationFrame(() => scrollToTop(true));

        if (brands.length) return;

        try {
            setBrandsLoading(true);
            setBrands(await getBrands());
        } finally {
            setBrandsLoading(false);
        }
    }

    function selectBrand(brand: BrandItem) {
        router.push({
            pathname: "/brands/[id]",
            params: {
                id: String(brand.id),
                name: brand.name,
            },
        });
    }

    useEffect(() => {
        if (!selectedBrand) return;

        let alive = true;
        const brandId = selectedBrand.id;

        async function reloadBrandProducts() {
            try {
                setCategoryLoading(true);
                setFeedProducts([]);
                setFeedPage(1);
                setFeedHasMore(true);

                const data = await getPagedProducts({
                    page: 1,
                    pageSize: PAGE_SIZE,
                    brandId,
                    ordering: brandOrdering,
                    minPrice: brandMinPrice,
                    maxPrice: brandMaxPrice,
                    hasDiscount: brandDiscountOnly,
                });
                const visibleData = data.filter(
                    (product) => product.brandId === brandId
                );

                if (!alive) return;
                setFeedProducts(visibleData);
                setFeedPage(2);
                setFeedHasMore(data.length >= PAGE_SIZE);
            } finally {
                if (alive) setCategoryLoading(false);
            }
        }

        reloadBrandProducts();
        return () => {
            alive = false;
        };
    }, [
        selectedBrand?.id,
        brandOrdering,
        brandMinPrice,
        brandMaxPrice,
        brandDiscountOnly,
    ]);

    function resetBrandFilters() {
        setBrandOrdering("-created_at");
        setBrandMinPrice("");
        setBrandMaxPrice("");
        setBrandDiscountOnly(false);
    }

    async function refreshCurrentView() {
        if (refreshing) return;

        try {
            setRefreshing(true);

            if (showBrands) {
                setBrandsLoading(true);
                setBrands(await getBrands());
                return;
            }

            if (activeSearch) {
                setSearchLoading(true);
                setSearchProducts(await searchCatalog(activeSearch));
                return;
            }

            if (selectedBrand) {
                setCategoryLoading(true);
                const data = await getPagedProducts({
                    page: 1,
                    pageSize: PAGE_SIZE,
                    brandId: selectedBrand.id,
                    ordering: brandOrdering,
                    minPrice: brandMinPrice,
                    maxPrice: brandMaxPrice,
                    hasDiscount: brandDiscountOnly,
                });
                setFeedProducts(
                    data.filter((product) => product.brandId === selectedBrand.id)
                );
                setFeedPage(2);
                setFeedHasMore(data.length >= PAGE_SIZE);
                return;
            }

            if (selectedCategory) {
                setCategoryLoading(true);
                const data = await getPagedProducts({
                    page: 1,
                    pageSize: PAGE_SIZE,
                    categoryId: selectedCategory.id,
                });
                setFeedProducts(data);
                setFeedPage(2);
                setFeedHasMore(data.length >= PAGE_SIZE);
                return;
            }

            if (saleOnly || newOnly || recommendedOnly) {
                setCategoryLoading(true);
                const data = await getPagedProducts({
                    page: 1,
                    pageSize: PAGE_SIZE,
                    onSale: saleOnly,
                    isNew: newOnly,
                    isRecommended: recommendedOnly,
                });
                setFeedProducts(data);
                setFeedPage(2);
                setFeedHasMore(data.length >= PAGE_SIZE);
                return;
            }

            await loadHome();
        } finally {
            setSearchLoading(false);
            setCategoryLoading(false);
            setBrandsLoading(false);
            setRefreshing(false);
            refreshCacheMeta();
        }
    }

    useEffect(() => {
        if (!languageReadyRef.current) {
            languageReadyRef.current = true;
            return;
        }

        refreshCurrentView();
    }, [language]);

    function handleScrollNearEnd(event: {
        nativeEvent: {
            layoutMeasurement: { height: number };
            contentOffset: { y: number };
            contentSize: { height: number };
        };
    }) {
        const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;

        const distanceFromBottom =
            contentSize.height - (layoutMeasurement.height + contentOffset.y);

        if (distanceFromBottom < 420) {
            loadFeed();
        }
    }

    if (showBrands) {
        return (
            <ThemedView style={styles.root}>
                <SafeAreaView edges={["top"]} style={styles.safeArea}>
                    <BrandsPanel
                        brands={brands}
                        loading={brandsLoading}
                        refreshing={refreshing}
                        onRefresh={refreshCurrentView}
                        onBack={() => {
                            setShowBrands(false);
                            scrollToTop(false);
                        }}
                        onSelectBrand={selectBrand}
                    />
                </SafeAreaView>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.root}>
            <SafeAreaView edges={["top"]} style={styles.safeArea}>
                <ScrollView
                    ref={scrollRef}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    stickyHeaderIndices={showBrands ? [] : [1]}
                    onScroll={handleScrollNearEnd}
                    scrollEventThrottle={400}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshCurrentView}
                            tintColor={palette.primary}
                            colors={[palette.primary]}
                        />
                    }
                    contentContainerStyle={styles.content}
                >
                    <HomeHeader />

                    {!showBrands ? (
                        <SearchCategoryBar
                        searchText={searchText}
                        activeSearch={activeSearch}
                        onSearchTextChange={setSearchText}
                        onSubmitSearch={submitSearch}
                        onClearSearch={clearSearch}
                        onOpenBrands={openBrands}
                        suggestions={searchSuggestions}
                        suggestionsLoading={suggestionsLoading}
                        onCloseSuggestions={() => setSearchSuggestions([])}
                        />
                    ) : null}

                    <OfflineBanner
                        visible={isOffline}
                        updatedAt={cacheUpdatedAt}
                    />

                    {showBrands ? (
                        <BrandsPanel
                            brands={brands}
                            loading={brandsLoading}
                            refreshing={refreshing}
                            onRefresh={refreshCurrentView}
                            onBack={() => {
                                setShowBrands(false);
                                scrollToTop(false);
                            }}
                            onSelectBrand={selectBrand}
                        />
                    ) : hasActiveFilter ? (
                        <>
                            {selectedBrand ? (
                                <View style={styles.brandFiltersPanel}>
                                    <View style={styles.brandFiltersHeader}>
                                        <ThemedText
                                            style={styles.brandFiltersTitle}
                                        >
                                            {t("filters")}
                                        </ThemedText>
                                        <TouchableOpacity
                                            hitSlop={8}
                                            onPress={resetBrandFilters}
                                        >
                                            <ThemedText
                                                style={styles.brandResetText}
                                            >
                                                {t("reset")}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView
                                        horizontal
                                        nestedScrollEnabled
                                        keyboardShouldPersistTaps="handled"
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={
                                            styles.brandSortList
                                        }
                                    >
                                        {brandSortOptions.map((option) => {
                                            const isActive =
                                                brandOrdering === option.value;
                                            return (
                                                <TouchableOpacity
                                                    activeOpacity={0.82}
                                                    key={option.value}
                                                    style={[
                                                        styles.brandSortChip,
                                                        isActive &&
                                                            styles.brandSortChipActive,
                                                    ]}
                                                    onPress={() =>
                                                        setBrandOrdering(
                                                            option.value
                                                        )
                                                    }
                                                >
                                                    <ThemedText
                                                        style={[
                                                            styles.brandSortText,
                                                            isActive &&
                                                                styles.brandSortTextActive,
                                                        ]}
                                                    >
                                                        {option.label}
                                                    </ThemedText>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                    <View style={styles.brandPriceFilterRow}>
                                        <TextInput
                                            value={brandMinPrice}
                                            onChangeText={setBrandMinPrice}
                                            keyboardType="numeric"
                                            placeholder={t("priceFrom")}
                                            placeholderTextColor={
                                                palette.secondary
                                            }
                                            style={styles.brandPriceInput}
                                        />
                                        <TextInput
                                            value={brandMaxPrice}
                                            onChangeText={setBrandMaxPrice}
                                            keyboardType="numeric"
                                            placeholder={t("priceTo")}
                                            placeholderTextColor={
                                                palette.secondary
                                            }
                                            style={styles.brandPriceInput}
                                        />
                                        <TouchableOpacity
                                            activeOpacity={0.82}
                                            style={[
                                                styles.brandDiscountChip,
                                                brandDiscountOnly &&
                                                    styles.brandDiscountChipActive,
                                            ]}
                                            onPress={() =>
                                                setBrandDiscountOnly(
                                                    (value) => !value
                                                )
                                            }
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.brandDiscountText,
                                                    brandDiscountOnly &&
                                                        styles.brandDiscountTextActive,
                                                ]}
                                            >
                                                {t("discount")}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : null}
                            <ActiveResults
                                title={
                                    activeSearch
                                        ? `${t("search")}: ${activeSearch}`
                                        : saleOnly
                                          ? t("sale")
                                        : newOnly
                                          ? t("new")
                                        : recommendedOnly
                                          ? t("recommended")
                                        : selectedBrand
                                          ? `${t("brand")}: ${selectedBrand.name}`
                                          : selectedCategory?.title || t("products")
                                }
                                loading={searchLoading || categoryLoading}
                                products={
                                    activeSearch
                                        ? searchProducts
                                        : feedProducts
                                }
                                feedLoading={feedLoading}
                                feedHasMore={feedHasMore}
                                showFeedStatus={!activeSearch}
                                onReset={
                                    selectedBrand
                                        ? undefined
                                        : () => selectCategory(null)
                                }
                            />
                        </>
                    ) : null}

                    {!hasActiveFilter && !showBrands ? (
                        <>
                            <WhatsNewCard onOpenSale={openSaleProducts} />
                            {loading ? <LoadingCard /> : null}
                            {error ? <ErrorCard onRetry={loadHome} /> : null}

                            <PromoCarousel
                                promotions={homeData?.promotions || []}
                            />

                            {homeData ? (
                                <>
                                    <ProductSection
                                        title={t("new")}
                                        action={t("allNew")}
                                        onAction={openNewProducts}
                                        products={homeData.newest}
                                    />
                                    <ProductSection
                                        title={t("recommended")}
                                        action={t("allRecommended")}
                                        onAction={openRecommendedProducts}
                                        products={homeData.recommended}
                                    />
                                    <ProductSection
                                        title={t("specialForYou")}
                                        products={feedProducts}
                                    >
                                        <FeedStatus
                                            loading={feedLoading}
                                            hasMore={feedHasMore}
                                        />
                                    </ProductSection>
                                </>
                            ) : null}
                        </>
                    ) : null}
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

