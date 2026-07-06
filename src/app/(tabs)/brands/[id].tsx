import { useNetInfo } from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    ListRenderItemInfo,
    RefreshControl,
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
import { getPagedProducts, ProductItem } from "@/services/catalog";

const PAGE_SIZE = 10;

export default function BrandProductsScreen() {
    const router = useRouter();
    const netInfo = useNetInfo();
    const t = useTranslations();
    const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
    const brandId = Number(id);
    const brandName = Array.isArray(name) ? name[0] : name || t("brand");
    const listRef = useRef<FlatList<ProductItem>>(null);
    const loadingRef = useRef(false);
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState("");
    const [ordering, setOrdering] = useState("-created_at");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [discountOnly, setDiscountOnly] = useState(false);
    const isOffline =
        netInfo.isConnected === false || netInfo.isInternetReachable === false;
    const sortOptions = [
        { label: t("sortNewest"), value: "-created_at" },
        { label: t("sortCheap"), value: "real_price" },
        { label: t("sortExpensive"), value: "-real_price" },
    ];

    const loadPage = useCallback(
        async ({ reset = false }: { reset?: boolean } = {}) => {
            if (
                !Number.isFinite(brandId) ||
                brandId <= 0 ||
                loadingRef.current ||
                (!hasMoreRef.current && !reset)
            ) {
                return;
            }

            const nextPage = reset ? 1 : pageRef.current;

            try {
                loadingRef.current = true;
                setLoading(true);
                setError("");

                const data = await getPagedProducts({
                    page: nextPage,
                    pageSize: PAGE_SIZE,
                    brandId,
                    ordering,
                    minPrice,
                    maxPrice,
                    hasDiscount: discountOnly,
                });
                const brandProducts = data.filter(
                    (product) => product.brandId === brandId
                );

                setProducts((previous) => {
                    const base = reset ? [] : previous;
                    const existingIds = new Set(
                        base.map((product) => product.id)
                    );
                    return [
                        ...base,
                        ...brandProducts.filter(
                            (product) => !existingIds.has(product.id)
                        ),
                    ];
                });

                pageRef.current = nextPage + 1;
                hasMoreRef.current = data.length >= PAGE_SIZE;
                setHasMore(hasMoreRef.current);
            } catch (requestError) {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : t("errorLoadData")
                );
            } finally {
                loadingRef.current = false;
                setLoading(false);
                setRefreshing(false);
            }
        },
        [brandId, discountOnly, maxPrice, minPrice, ordering]
    );

    useEffect(() => {
        pageRef.current = 1;
        hasMoreRef.current = true;
        setHasMore(true);
        setProducts([]);
        loadPage({ reset: true });
    }, [loadPage]);

    function resetFilters() {
        setOrdering("-created_at");
        setMinPrice("");
        setMaxPrice("");
        setDiscountOnly(false);
    }

    function refresh() {
        setRefreshing(true);
        pageRef.current = 1;
        hasMoreRef.current = true;
        loadPage({ reset: true });
    }

    function renderProduct({ item }: ListRenderItemInfo<ProductItem>) {
        return <ProductCard product={item} />;
    }

    return (
        <SafeAreaView edges={["top"]} style={styles.root}>
            <FlatList
                ref={listRef}
                data={products}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderProduct}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}
                columnWrapperStyle={styles.productColumn}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={7}
                removeClippedSubviews
                onEndReached={() => loadPage()}
                onEndReachedThreshold={0.55}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={palette.primary}
                        colors={[palette.primary]}
                    />
                }
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <ThemedText style={styles.title}>
                                {brandName}
                            </ThemedText>
                            <ThemedText style={styles.subtitle}>
                                {t("brandProducts")}
                            </ThemedText>
                        </View>

                        <OfflineBanner visible={isOffline} />

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
                                    const active = ordering === option.value;
                                    return (
                                        <TouchableOpacity
                                            activeOpacity={0.82}
                                            key={option.value}
                                            style={[
                                                styles.sortChip,
                                                active && styles.sortChipActive,
                                            ]}
                                            onPress={() =>
                                                setOrdering(option.value)
                                            }
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.sortText,
                                                    active &&
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

                        {loading && !products.length ? (
                            <ProductGridSkeleton count={6} />
                        ) : null}
                        {!loading && !products.length ? (
                            <ThemedText style={styles.emptyText}>
                                {error || t("brandEmpty")}
                            </ThemedText>
                        ) : null}
                    </>
                }
                ListFooterComponent={
                    products.length ? (
                        <View style={styles.productsFooter}>
                            <FeedStatus loading={loading} hasMore={hasMore} />
                        </View>
                    ) : null
                }
            />

            <View pointerEvents="box-none" style={styles.fixedBackBar}>
                <TouchableOpacity
                    activeOpacity={0.84}
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft
                        color={palette.primary}
                        size={19}
                        strokeWidth={2.2}
                    />
                    <ThemedText style={styles.backButtonText}>
                        {t("backToBrands")}
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
