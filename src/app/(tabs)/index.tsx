import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import {
  ActiveResults,
  ErrorCard,
  FeedStatus,
  HomeHeader,
  LoadingCard,
  ProductSection,
  PromoCarousel,
  SearchCategoryBar,
  WhatsNewCard,
} from '@/features/home/components';
import { styles } from '@/features/home/home.styles';
import { HomeData } from '@/features/home/types';
import {
  CategoryItem,
  getHomeCatalog,
  getPagedProducts,
  ProductItem,
  searchCatalog,
} from '@/services/catalog';
import { useCartStore } from '@/store/cart';

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [searchProducts, setSearchProducts] = useState<ProductItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [feedProducts, setFeedProducts] = useState<ProductItem[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const totalQuantity = useCartStore((state) => state.totalQuantity());

  async function loadHome() {
    try {
      setLoading(true);
      setError(null);

      const data = await getHomeCatalog();
      setHomeData(data);
      setFeedProducts(data.special);
      setFeedPage(2);
      setFeedHasMore(data.special.length >= 8);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось загрузить главную');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHome();
  }, []);

  const categories = homeData?.categories || [];
  const parentCategories = categories.filter((category) => !category.parent);
  const selectedParentId = selectedCategory?.parent || selectedCategory?.id || null;
  const childCategories = selectedParentId
    ? categories.filter((category) => category.parent === selectedParentId)
    : [];
  const hasActiveFilter = Boolean(selectedCategory || activeSearch);

  async function loadFeed({
    reset = false,
    categoryId = selectedCategory?.id || null,
  }: {
    reset?: boolean;
    categoryId?: number | null;
  } = {}) {
    if (feedLoading || (!feedHasMore && !reset) || activeSearch) return;

    const nextPage = reset ? 1 : feedPage;
    try {
      setFeedLoading(true);
      const data = await getPagedProducts({ page: nextPage, pageSize: PAGE_SIZE, categoryId });

      setFeedProducts((previous) => {
        const base = reset ? [] : previous;
        const existingIds = new Set(base.map((product) => product.id));
        return [...base, ...data.filter((product) => !existingIds.has(product.id))];
      });

      setFeedPage(nextPage + 1);
      setFeedHasMore(data.length >= PAGE_SIZE);
    } finally {
      setFeedLoading(false);
    }
  }

  async function selectCategory(category: CategoryItem | null) {
    if ((selectedCategory?.id || null) === (category?.id || null) && !activeSearch) return;

    setSelectedCategory(category);
    setActiveSearch('');
    setSearchText('');
    setSearchProducts([]);
    setFeedProducts([]);
    setFeedPage(1);
    setFeedHasMore(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });

    if (!category) {
      loadFeed({ reset: true, categoryId: null });
      return;
    }

    try {
      setCategoryLoading(true);
      const data = await getPagedProducts({ page: 1, pageSize: PAGE_SIZE, categoryId: category.id });
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
    setFeedProducts([]);
    setFeedHasMore(false);
    setActiveSearch(query);
    scrollRef.current?.scrollTo({ y: 0, animated: true });

    try {
      setSearchLoading(true);
      setSearchProducts(await searchCatalog(query));
    } finally {
      setSearchLoading(false);
    }
  }

  function clearSearch() {
    setSearchText('');
    setActiveSearch('');
    setSearchProducts([]);
    setFeedHasMore(true);
    loadFeed({ reset: true, categoryId: selectedCategory?.id || null });
  }

  function handleScrollNearEnd(event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    setShowFloatingCart(contentOffset.y > 150);

    const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);

    if (distanceFromBottom < 420) {
      loadFeed();
    }
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          stickyHeaderIndices={[1]}
          onScroll={handleScrollNearEnd}
          scrollEventThrottle={400}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <HomeHeader />

          <SearchCategoryBar
            searchText={searchText}
            activeSearch={activeSearch}
            selectedCategory={selectedCategory}
            parentCategories={parentCategories}
            childCategories={childCategories}
            onSearchTextChange={setSearchText}
            onSubmitSearch={submitSearch}
            onClearSearch={clearSearch}
            onSelectCategory={selectCategory}
          />

          {hasActiveFilter ? (
            <ActiveResults
              title={activeSearch ? `Поиск: ${activeSearch}` : selectedCategory?.title || 'Товары'}
              loading={searchLoading || categoryLoading}
              products={activeSearch ? searchProducts : feedProducts}
              feedLoading={feedLoading}
              feedHasMore={feedHasMore}
              showFeedStatus={!activeSearch}
              onReset={() => selectCategory(null)}
            />
          ) : null}

          <WhatsNewCard promotion={homeData?.currentPromotion} />
          {loading ? <LoadingCard /> : null}
          {error ? <ErrorCard onRetry={loadHome} /> : null}

          <PromoCarousel promotions={homeData?.promotions || []} />

          {homeData ? (
            <>
              <ProductSection title="Рекомендуем" products={homeData.recommended} />
              <ProductSection title="Новинки" products={homeData.newest} />
              <ProductSection title="Акции" products={homeData.sale} />
              <ProductSection title="Специально для тебя" action="Еще" products={feedProducts}>
                <FeedStatus loading={feedLoading} hasMore={feedHasMore} />
              </ProductSection>
            </>
          ) : null}
        </ScrollView>

        {showFloatingCart ? (
          <TouchableOpacity activeOpacity={0.85} style={styles.floatingCartButton} onPress={() => router.push('/cart')}>
            <ShoppingBag color="#ffffff" size={22} strokeWidth={2.2} />
            {totalQuantity ? (
              <View style={styles.floatingCartBadge}>
                <ThemedText style={styles.floatingCartBadgeText}>{totalQuantity}</ThemedText>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}
