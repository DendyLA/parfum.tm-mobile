import { absoluteMediaUrl, apiGet, asList } from "./api";
import { withCache } from "./cache";

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
};

export type PromotionDetail = PromoItem & {
    description: string;
    targetCategory?: number | null;
    discountOnly?: boolean;
};

export type CategoryItem = {
    id: number;
    title: string;
    slug?: string;
    parent?: number | null;
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
    translations?: TranslationMap;
    image?: string | null;
    target_category?: number | null;
    discount_only?: boolean;
    link?: string;
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
};

function pickTranslation(
    translations?: TranslationMap,
    key: "name" | "title" | "description" = "name"
) {
    return (
        translations?.ru?.[key] ||
        translations?.tk?.[key] ||
        Object.values(translations || {})[0]?.[key] ||
        ""
    );
}

function toNumber(value: string | number | null | undefined) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? Math.ceil(numberValue) : 0;
}

export function mapProduct(product: ApiProduct): ProductItem {
    const title =
        pickTranslation(product.translations, "name") || "Без названия";
    const category =
        pickTranslation(product.category?.translations, "name") ||
        product.category?.name ||
        "Категория";
    const price = toNumber(product.discount_price || product.price);
    const oldPrice = product.discount_price
        ? toNumber(product.price)
        : undefined;

    return {
        id: product.id,
        slug: product.slug,
        title,
        category,
        price,
        oldPrice,
        image: absoluteMediaUrl(product.image),
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
    return withCache("current-promotion", async () => {
        const promo = await apiGet<CurrentPromotion>(
            "/mobile/promotions/current/"
        );
        return {
            ...promo,
            image: absoluteMediaUrl(promo.image),
        };
    });
}

export async function getPromotions() {
    return withCache("promotions", async () => {
        const data = await apiGet<
            | Array<{
                  id: number;
                  translations?: TranslationMap;
                  image?: string | null;
                  link?: string;
              }>
            | {
                  results?: Array<{
                      id: number;
                      translations?: TranslationMap;
                      image?: string | null;
                      link?: string;
                  }>;
              }
        >("/promotions/?active=true&page_size=8");

        return asList(data).map((promo) => ({
            id: promo.id,
            title: pickTranslation(promo.translations, "title") || "Акция",
            subtitle:
                pickTranslation(promo.translations, "description") ||
                "Специальное предложение",
            image: absoluteMediaUrl(promo.image),
            link: promo.link,
        }));
    });
}

export async function getPromotionById(id: string | number) {
    return withCache(`promotion:${id}`, async () => {
        const promo = await apiGet<ApiPromotion>(`/promotions/${id}/`);
        const description = pickTranslation(
            promo.translations,
            "description"
        );

        return {
            id: promo.id,
            title: pickTranslation(promo.translations, "title") || "Акция",
            subtitle: description
                ? description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
                : "Специальное предложение",
            description,
            image: absoluteMediaUrl(promo.image),
            link: promo.link,
            targetCategory: promo.target_category,
            discountOnly: promo.discount_only,
        };
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
    return withCache("categories", async () => {
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
                    "Категория",
                slug: category.slug,
                parent: category.parent || null,
            });

            category.children?.forEach(addCategory);
        }

        categories.forEach(addCategory);

        return flattened;
    });
}

export async function getProducts(path: string) {
    return withCache(`products:${path}`, async () => {
        const data = await apiGet<ApiProduct[] | { results?: ApiProduct[] }>(
            path
        );
        return asList(data).map(mapProduct);
    });
}

export async function getProductBySlug(slug: string) {
    return withCache(`product:${slug}`, async () => {
        const data = await apiGet<ApiProduct>(`/products/${slug}/`);
        return mapProductDetail(data);
    });
}

export async function searchCatalog(query: string, limit = 20) {
    const params = new URLSearchParams();
    params.append("search", query);
    params.append("limit", String(limit));

    return withCache(`search:${params.toString()}`, async () => {
        const data = await apiGet<{ products?: ApiProduct[] }>(
            `/products/search/full?${params.toString()}`
        );
        return asList(data.products).map(mapProduct);
    });
}

export async function getPagedProducts({
    page = 1,
    pageSize = 10,
    categoryId,
    ordering,
    minPrice,
    maxPrice,
    hasDiscount,
    inStock = true,
}: {
    page?: number;
    pageSize?: number;
    categoryId?: number | null;
    ordering?: string;
    minPrice?: string;
    maxPrice?: string;
    hasDiscount?: boolean;
    inStock?: boolean;
} = {}) {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("page_size", String(pageSize));
    params.append("in_stock", String(inStock));

    if (categoryId) {
        params.append("category", String(categoryId));
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
        getProducts("/products/?page_size=4&is_recommended=true&in_stock=true"),
        getProducts(
            "/products/?page_size=4&ordering=-created_at&in_stock=true"
        ),
        getProducts("/products/?page_size=4&on_sale=true&in_stock=true"),
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
