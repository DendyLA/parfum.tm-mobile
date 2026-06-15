import { absoluteMediaUrl, apiGet, asList } from "./api";
import { withCache } from "./cache";
import { translate } from "@/i18n";
import { getCurrentLanguage } from "@/store/language";

export type TranslationMap = Record<
    string,
    { name?: string; title?: string; description?: string }
>;

export type ApiProduct = {
    id: number;
    slug?: string;
    translations?: TranslationMap;
    category?: {
        translations?: TranslationMap;
        name?: string;
    } | null;
    brand?: {
        id?: number;
        name?: string;
        slug?: string;
    } | null;
    price?: string | number | null;
    discount_price?: string | number | null;
    image?: string | null;
    gallery?: Array<{
        id: number;
        image?: string | null;
        alt_text?: string | null;
    }>;
    variations?: Array<{
        id: number;
        value?: string;
        color_hex?: string | null;
        is_active?: boolean;
        variation_type?: { id: number; code?: string; name?: string };
        gallery?: Array<{
            id: number;
            image?: string | null;
            alt_text?: string | null;
        }>;
    }>;
    count?: number;
};

export type ProductItem = {
    id: number;
    slug?: string;
    title: string;
    category: string;
    brandId?: number | null;
    price: number;
    oldPrice?: number;
    image: string | null;
};

export type ProductDetail = ProductItem & {
    description: string;
    count?: number;
    gallery: Array<{
        id: number;
        image: string | null;
        altText?: string | null;
    }>;
    variations: Array<{
        id: number;
        value?: string;
        colorHex?: string | null;
        isActive?: boolean;
        typeName?: string;
        gallery?: Array<{
            id: number;
            image: string | null;
            altText?: string | null;
        }>;
    }>;
};

export type PromoItem = {
    id: number;
    title: string;
    subtitle: string;
    image: string | null;
    link?: string;
    slug?: string;
    linkType?: string;
    productsCount?: number;
};

export type PromotionDetail = PromoItem & {
    description: string;
    targetCategory?: number | null;
    discountOnly?: boolean;
    products?: ProductItem[];
};

export type CategoryItem = {
    id: number;
    title: string;
    slug?: string;
    parent?: number | null;
};

export type BrandItem = {
    id: number;
    name: string;
    slug?: string;
    logo: string | null;
};

type ApiBrand = {
    id: number;
    name?: string;
    slug?: string;
    logo?: string | null;
};

type ApiCategory = {
    id: number;
    parent?: number | null;
    slug?: string;
    translations?: TranslationMap;
    children?: ApiCategory[];
};

type ApiPromotion = {
    id: number;
    slug?: string;
    translations?: TranslationMap;
    image?: string | null;
    target_category?: number | null;
    discount_only?: boolean;
    link_type?: string;
    link?: string;
    products_count?: number;
    products?: ApiProduct[];
};

type PaginatedResponse<T> = {
    results?: T[];
    next?: string | null;
};

export type CurrentPromotion = {
    id: number | null;
    title: string;
    text: string | null;
    image: string | null;
    link?: string;
    slug?: string;
    link_type?: string;
    products_count?: number;
};

function pickTranslation(
    translations?: TranslationMap,
    key: "name" | "title" | "description" = "name"
) {
    const language = getCurrentLanguage();
    const fallbackLanguage = language === "ru" ? "tk" : "ru";

    return (
        translations?.[language]?.[key] ||
        translations?.[fallbackLanguage]?.[key] ||
        Object.values(translations || {})[0]?.[key] ||
        ""
    );
}

function capitalizeFirst(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";

    return trimmed.charAt(0).toLocaleUpperCase("ru-RU") + trimmed.slice(1);
}

function toNumber(value: string | number | null | undefined) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? Math.ceil(numberValue) : 0;
}

function localizedCacheKey(key: string) {
    return `${getCurrentLanguage()}:${key}`;
}

export function mapProduct(product: ApiProduct): ProductItem {
    const title =
        pickTranslation(product.translations, "name") || translate("product");
    const category =
        pickTranslation(product.category?.translations, "name") ||
        product.category?.name ||
        translate("categories");
    const price = toNumber(product.discount_price || product.price);
    const oldPrice = product.discount_price
        ? toNumber(product.price)
        : undefined;

    return {
        id: product.id,
        slug: product.slug,
        title,
        category,
        brandId: product.brand?.id ?? null,
        price,
        oldPrice,
        image: absoluteMediaUrl(product.image),
    };
}

function mapVisibleProducts(products: ApiProduct[]) {
    return products.map(mapProduct).filter((product) => product.price > 0);
}

function getPromotionSlug(promo: ApiPromotion) {
    if (promo.slug) return promo.slug;
    const match = promo.link?.match(/\/promotions\/([^/?#]+)/);
    return match?.[1] || "";
}

function mapPromotionDetail(promo: ApiPromotion): PromotionDetail {
    const description = pickTranslation(promo.translations, "description");
    const title = capitalizeFirst(
        pickTranslation(promo.translations, "title") || translate("promotion")
    );

    return {
        id: promo.id,
        title,
        subtitle: description
            ? description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
            : translate("saleMarkedProducts"),
        description,
        image: absoluteMediaUrl(promo.image),
        link: promo.link,
        slug: getPromotionSlug(promo),
        linkType: promo.link_type,
        productsCount: Number(promo.products_count || 0),
        targetCategory: promo.target_category,
        discountOnly: promo.discount_only,
        products: mapVisibleProducts(promo.products || []),
    };
}

export function mapProductDetail(product: ApiProduct): ProductDetail {
    return {
        ...mapProduct(product),
        description: pickTranslation(product.translations, "description"),
        count: product.count,
        gallery: (product.gallery || []).map((image) => ({
            id: image.id,
            image: absoluteMediaUrl(image.image),
            altText: image.alt_text,
        })),
        variations: (product.variations || []).map((variation) => ({
            id: variation.id,
            value: variation.value,
            colorHex: variation.color_hex,
            isActive: variation.is_active,
            typeName: variation.variation_type?.name,
            gallery: (variation.gallery || []).map((image) => ({
                id: image.id,
                image: absoluteMediaUrl(image.image),
                altText: image.alt_text,
            })),
        })),
    };
}

export async function getCurrentPromotion() {
    return withCache(localizedCacheKey("current-promotion"), async () => {
        const promo = await apiGet<CurrentPromotion>(
            "/mobile/promotions/current/"
        );
        return {
            ...promo,
            title: capitalizeFirst(promo.title || translate("sale")),
            image: absoluteMediaUrl(promo.image),
            products_count: Number(promo.products_count || 0),
        };
    });
}

export async function getPromotions() {
    return withCache(localizedCacheKey("promotions"), async () => {
        const data = await apiGet<
            | Array<{
                  id: number;
                  slug?: string;
                  translations?: TranslationMap;
                  image?: string | null;
                  link_type?: string;
                  link?: string;
                  products_count?: number;
              }>
            | {
                  results?: Array<{
                      id: number;
                      slug?: string;
                      translations?: TranslationMap;
                      image?: string | null;
                      link_type?: string;
                      link?: string;
                      products_count?: number;
                  }>;
              }
        >("/promotions/?active=true&page_size=8");

        return asList(data).map((promo) => ({
            id: promo.id,
            title: capitalizeFirst(
                pickTranslation(promo.translations, "title") || translate("promotion")
            ),
            subtitle:
                pickTranslation(promo.translations, "description") ||
                translate("saleMarkedProducts"),
            image: absoluteMediaUrl(promo.image),
            link: promo.link,
            slug: promo.slug,
            linkType: promo.link_type,
            productsCount: Number(promo.products_count || 0),
        }));
    });
}

export async function getPromotionById(id: string | number) {
    return withCache(localizedCacheKey(`promotion:${id}`), async () => {
        const promo = await apiGet<ApiPromotion>(`/promotions/${id}/`);
        const detail = mapPromotionDetail(promo);
        const productsCount = detail.productsCount ?? 0;
        const shouldLoadBySlug =
            !detail.products?.length &&
            (productsCount > 0 ||
                detail.linkType === "products" ||
                Boolean(detail.link?.startsWith("/promotions/"))) &&
            Boolean(detail.slug);

        if (!shouldLoadBySlug) {
            return detail;
        }

        try {
            const bySlug = await apiGet<ApiPromotion>(
                `/promotions/by-slug/${detail.slug}/`
            );
            return mapPromotionDetail(bySlug);
        } catch {
            return detail;
        }
    });
}

export function getPromotionCatalogParams(link?: string) {
    if (!link) return null;

    const query = link.includes("?") ? link.split("?")[1] : link;
    const params = new URLSearchParams(query);
    const categoryId = Number(params.get("category"));

    if (!Number.isFinite(categoryId) || categoryId <= 0) {
        return null;
    }

    return {
        categoryId,
        hasDiscount:
            params.get("has_discount") === "true" ||
            params.get("discount_only") === "true",
    };
}

export async function getCategories() {
    return withCache(localizedCacheKey("categories"), async () => {
        const categories: ApiCategory[] = [];
        let nextUrl: string | null = "/categories/?page_size=100";

        while (nextUrl) {
            const data: ApiCategory[] | PaginatedResponse<ApiCategory> =
                await apiGet<ApiCategory[] | PaginatedResponse<ApiCategory>>(
                    nextUrl
                );

            if (Array.isArray(data)) {
                categories.push(...data);
                nextUrl = null;
            } else {
                categories.push(
                    ...(Array.isArray(data.results) ? data.results : [])
                );
                nextUrl = data.next || null;
            }
        }

        const seen = new Set<number>();
        const flattened: CategoryItem[] = [];

        function addCategory(category: ApiCategory) {
            if (seen.has(category.id)) return;

            seen.add(category.id);
            flattened.push({
                id: category.id,
                title:
                    pickTranslation(category.translations, "name") ||
                    category.slug ||
                    translate("categories"),
                slug: category.slug,
                parent: category.parent || null,
            });

            category.children?.forEach(addCategory);
        }

        categories.forEach(addCategory);

        return flattened;
    });
}

export async function getBrands() {
    return withCache("brands", async () => {
        const brands: ApiBrand[] = [];
        let nextUrl: string | null = "/brands/?page=1&page_size=100";

        while (nextUrl) {
            const data: ApiBrand[] | PaginatedResponse<ApiBrand> =
                await apiGet<ApiBrand[] | PaginatedResponse<ApiBrand>>(
                    nextUrl
                );

            if (Array.isArray(data)) {
                brands.push(...data);
                nextUrl = null;
            } else {
                brands.push(...asList<ApiBrand>(data));
                nextUrl = data.next || null;
            }
        }

        return brands
            .map((brand) => ({
                id: brand.id,
                name: brand.name || brand.slug || translate("brand"),
                slug: brand.slug,
                logo: absoluteMediaUrl(brand.logo),
            }))
            .sort((first, second) =>
                first.name.localeCompare(second.name, ["en", "ru"])
            );
    });
}

export async function getProducts(path: string) {
    return withCache(localizedCacheKey(`products:${path}`), async () => {
        const data = await apiGet<ApiProduct[] | { results?: ApiProduct[] }>(
            path
        );
        return mapVisibleProducts(asList(data));
    });
}

async function getNewestProducts() {
    return withCache(localizedCacheKey("products:newest:isNew:v3"), async () => {
        const data = await apiGet<ApiProduct[] | { results?: ApiProduct[] }>(
            "/products/?page=1&page_size=5&is_new=true&in_stock=true"
        );
        return mapVisibleProducts(asList(data));
    });
}

export async function getProductBySlug(slug: string) {
    return withCache(localizedCacheKey(`product:${slug}`), async () => {
        const data = await apiGet<ApiProduct>(`/products/${slug}/`);
        return mapProductDetail(data);
    });
}

export async function searchCatalog(query: string, limit = 20) {
    const params = new URLSearchParams();
    params.append("search", query);
    params.append("limit", String(limit));

    return withCache(localizedCacheKey(`search:${params.toString()}`), async () => {
        const data = await apiGet<{ products?: ApiProduct[] }>(
            `/products/search/full?${params.toString()}`
        );
        return mapVisibleProducts(asList(data.products));
    });
}

export async function getPagedProducts({
    page = 1,
    pageSize = 10,
    categoryId,
    brandId,
    ordering,
    minPrice,
    maxPrice,
    hasDiscount,
    onSale,
    isNew,
    isRecommended,
    inStock = true,
}: {
    page?: number;
    pageSize?: number;
    categoryId?: number | null;
    brandId?: number | null;
    ordering?: string;
    minPrice?: string;
    maxPrice?: string;
    hasDiscount?: boolean;
    onSale?: boolean;
    isNew?: boolean;
    isRecommended?: boolean;
    inStock?: boolean;
} = {}) {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("page_size", String(pageSize));
    params.append("in_stock", String(inStock));

    if (categoryId) {
        params.append("category", String(categoryId));
    }
    if (brandId) {
        params.append("brand", String(brandId));
    }
    if (ordering) {
        params.append("ordering", ordering);
    }
    if (minPrice) {
        params.append("min_price", minPrice);
    }
    if (maxPrice) {
        params.append("max_price", maxPrice);
    }
    if (hasDiscount) {
        params.append("has_discount", "true");
    }
    if (onSale) {
        params.append("on_sale", "true");
        params.append("isOnSale", "true");
    }
    if (isNew) {
        params.append("is_new", "true");
        params.append("isNew", "true");
    }
    if (isRecommended) {
        params.append("is_recommended", "true");
        params.append("isRecommended", "true");
    }

    return getProducts(`/products/?${params.toString()}`);
}

export async function getHomeCatalog() {
    const [
        currentPromotion,
        promotions,
        categories,
        recommended,
        newest,
        sale,
        special,
    ] = await Promise.all([
        getCurrentPromotion(),
        getPromotions(),
        getCategories(),
        getProducts("/products/?page_size=4&is_recommended=true&isRecommended=true&in_stock=true"),
        getNewestProducts(),
        getProducts("/products/?page_size=4&on_sale=true&isOnSale=true&in_stock=true"),
        getProducts("/products/?page_size=8&in_stock=true"),
    ]);

    return {
        currentPromotion,
        promotions,
        categories,
        recommended,
        newest,
        sale,
        special,
    };
}
