import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "parfum-cache:";
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24;

type CacheEntry<T> = {
    savedAt: string;
    data: T;
};

function cacheKeyFor(key: string) {
    return `${CACHE_PREFIX}${key}`;
}

function isEmptyValue(value: unknown) {
    if (Array.isArray(value)) return value.length === 0;
    if (value && typeof value === "object" && "results" in value) {
        const results = (value as { results?: unknown }).results;
        return Array.isArray(results) && results.length === 0;
    }
    return false;
}

async function readCacheEntry<T>(key: string) {
    const rawEntry = await AsyncStorage.getItem(cacheKeyFor(key));
    if (!rawEntry) return null;

    const parsed = JSON.parse(rawEntry) as CacheEntry<T> | T;

    if (
        parsed &&
        typeof parsed === "object" &&
        "savedAt" in parsed &&
        "data" in parsed
    ) {
        return parsed as CacheEntry<T>;
    }

    return {
        savedAt: new Date(0).toISOString(),
        data: parsed as T,
    };
}

export async function getCacheMeta(key: string) {
    const entry = await readCacheEntry<unknown>(key);
    return entry ? { savedAt: entry.savedAt } : null;
}

export async function withCache<T>(
    key: string,
    loader: () => Promise<T>,
    { ttlMs = DEFAULT_TTL_MS }: { ttlMs?: number } = {}
): Promise<T> {
    const cacheKey = cacheKeyFor(key);

    try {
        const fresh = await loader();
        const cached = await readCacheEntry<T>(key);
        const shouldKeepExisting =
            cached && !isEmptyValue(cached.data) && isEmptyValue(fresh);

        if (!shouldKeepExisting) {
            const entry: CacheEntry<T> = {
                savedAt: new Date().toISOString(),
                data: fresh,
            };
            await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
        }

        return shouldKeepExisting ? cached.data : fresh;
    } catch (error) {
        const cached = await readCacheEntry<T>(key);

        if (cached) {
            const age = Date.now() - new Date(cached.savedAt).getTime();
            if (age <= ttlMs || ttlMs <= 0) {
                return cached.data;
            }

            return cached.data;
        }

        throw error;
    }
}
