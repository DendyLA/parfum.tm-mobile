import { useNetInfo } from "@react-native-community/netinfo";
import { Image } from "expo-image";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Share2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    Share,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

import { OfflineBanner } from "@/components/offline-banner";
import { ProductGridSkeleton, PromotionSkeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { FeedStatus, ProductGrid } from "@/features/home/components";
import {
    htmlBaseStyle,
    htmlTags,
    palette,
    styles,
} from "@/features/promotion-detail/promotion-detail.styles";
import {
    getPagedProducts,
    getPromotionById,
    getPromotionCatalogParams,
    ProductItem,
    PromotionDetail,
} from "@/services/catalog";
import { getCacheMeta } from "@/services/cache";

const PAGE_SIZE = 10;
const LOAD_MORE_THRESHOLD = 900;

function normalizeHtml(value: string) {
    return value.replace(/&nbsp;|&#160;|&#xA0;/gi, " ").replace(/\u00a0/g, " ");
}

function plainTextFromHtml(value: string) {
    return normalizeHtml(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getPromotionProductsCacheKey({
    categoryId,
    hasDiscount,
    page,
}: {
    categoryId: number;
    hasDiscount?: boolean;
    page: number;
}) {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("page_size", String(PAGE_SIZE));
    params.append("in_stock", "true");
    params.append("category", String(categoryId));
    if (hasDiscount) params.append("has_discount", "true");
    return `products:/products/?${params.toString()}`;
}

export default function PromotionDetailScreen() {
    const router = useRouter();
    const netInfo = useNetInfo();
    const { width } = useWindowDimensions();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [promotion, setPromotion] = useState<PromotionDetail | null>(null);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [promotionLoading, setPromotionLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | null>(null);
    const productsLoadingRef = useRef(false);
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const isOffline =
        netInfo.isConnected === false || netInfo.isInternetReachable === false;

    const loadProducts = useCallback(
        async ({
            promotionData = promotion,
            reset = false,
        }: {
            promotionData?: PromotionDetail | null;
            reset?: boolean;
        } = {}) => {
            if (
                !promotionData ||
                productsLoadingRef.current ||
                (!hasMoreRef.current && !reset)
            ) {
                return;
            }

            const params = getPromotionCatalogParams(promotionData.link);
            if (!params) return;

            const nextPage = reset ? 1 : pageRef.current;

            try {
                productsLoadingRef.current = true;
                setProductsLoading(true);
                const data = await getPagedProducts({
                    page: nextPage,
                    pageSize: PAGE_SIZE,
                    categoryId: params.categoryId,
                    hasDiscount: params.hasDiscount,
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
                setPage(pageRef.current);
                setHasMore(hasMoreRef.current);
                const metas = await Promise.all([
                    getCacheMeta(`promotion:${promotionData.id}`),
                    getCacheMeta(
                        getPromotionProductsCacheKey({
                            categoryId: params.categoryId,
                            hasDiscount: params.hasDiscount,
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
        [promotion]
    );

    useEffect(() => {
        let alive = true;

        async function loadPromotion() {
            if (!id) {
                setError("Акция не найдена");
                setPromotionLoading(false);
                return;
            }

            try {
                setPromotionLoading(true);
                setError(null);

                const data = await getPromotionById(id);
                const meta = await getCacheMeta(`promotion:${id}`);
                const params = getPromotionCatalogParams(data.link);

                if (!params) {
                    throw new Error("У этой акции не выбрана категория.");
                }

                if (alive) {
                    setPromotion(data);
                    setProducts([]);
                    pageRef.current = 1;
                    hasMoreRef.current = true;
                    setPage(1);
                    setHasMore(true);
                    setCacheUpdatedAt(meta?.savedAt || null);
                    loadProducts({ promotionData: data, reset: true });
                }
            } catch (requestError) {
                if (alive) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Не удалось загрузить акцию"
                    );
                }
            } finally {
                if (alive) setPromotionLoading(false);
            }
        }

        loadPromotion();
        return () => {
            alive = false;
        };
    }, [id]);

    function maybeLoadMore(
        event?: NativeSyntheticEvent<NativeScrollEvent>
    ) {
        if (!event) {
            loadProducts();
            return;
        }

        const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;
        const distanceFromBottom =
            contentSize.height - (layoutMeasurement.height + contentOffset.y);

        if (distanceFromBottom < LOAD_MORE_THRESHOLD) {
            loadProducts();
        }
    }

    function handleShare() {
        if (!promotion) return;

        Share.share({
            title: promotion.title,
            message:
                plainTextFromHtml(promotion.description || "") ||
                promotion.title,
        });
    }

    if (promotionLoading) {
        return (
            <SafeAreaView style={styles.root}>
                <PromotionSkeleton />
            </SafeAreaView>
        );
    }

    if (error || !promotion) {
        return (
            <SafeAreaView style={styles.root}>
                <View style={styles.loadingWrap}>
                    <ThemedText style={styles.errorText}>
                        {error || "Акция не найдена"}
                    </ThemedText>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.catalogButton}
                        onPress={() => router.replace("/" as Href)}
                    >
                        <ThemedText style={styles.catalogButtonText}>
                            В каталог
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={["top"]} style={styles.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                onContentSizeChange={() => maybeLoadMore()}
                onMomentumScrollEnd={maybeLoadMore}
                onScroll={maybeLoadMore}
                onScrollEndDrag={maybeLoadMore}
                scrollEventThrottle={80}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.iconButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft
                            color={palette.primary}
                            size={22}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Акция</ThemedText>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.iconButton}
                        onPress={handleShare}
                    >
                        <Share2
                            color={palette.primary}
                            size={20}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>
                </View>

                <OfflineBanner
                    visible={isOffline}
                    updatedAt={cacheUpdatedAt}
                />

                {promotion.image ? (
                    <View style={styles.hero}>
                        <Image
                            source={{ uri: promotion.image }}
                            contentFit="contain"
                            style={styles.heroImage}
                        />
                    </View>
                ) : null}

                <ThemedText style={styles.title}>{promotion.title}</ThemedText>

                {promotion.description ? (
                    <View style={styles.description}>
                        <RenderHTML
                            contentWidth={width - 32}
                            source={{
                                html: normalizeHtml(promotion.description),
                            }}
                            baseStyle={htmlBaseStyle}
                            tagsStyles={htmlTags}
                        />
                    </View>
                ) : null}

                <ThemedText style={styles.sectionTitle}>
                    Товары акции
                </ThemedText>

                {products.length ? (
                    <>
                        <ProductGrid items={products} />
                        <FeedStatus
                            loading={productsLoading}
                            hasMore={hasMore}
                        />
                        <TouchableOpacity
                            activeOpacity={0.86}
                            style={styles.catalogButton}
                            onPress={() => router.replace("/" as Href)}
                        >
                            <ThemedText style={styles.catalogButtonText}>
                                В каталог
                            </ThemedText>
                        </TouchableOpacity>
                    </>
                ) : productsLoading ? (
                    <ProductGridSkeleton count={4} />
                ) : (
                    <View style={styles.emptyBlock}>
                        <ThemedText style={styles.emptyTitle}>
                            В этой акции пока нет товаров
                        </ThemedText>
                        <TouchableOpacity
                            activeOpacity={0.86}
                            style={styles.catalogButton}
                            onPress={() => router.replace("/" as Href)}
                        >
                            <ThemedText style={styles.catalogButtonText}>
                                В каталог
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
