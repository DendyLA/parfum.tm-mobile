import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "parfum-cache:";

export async function withCache<T>(
    key: string,
    loader: () => Promise<T>
): Promise<T> {
    const cacheKey = `${CACHE_PREFIX}${key}`;

    try {
        const fresh = await loader();
        await AsyncStorage.setItem(cacheKey, JSON.stringify(fresh));
        return fresh;
    } catch (error) {
        const cached = await AsyncStorage.getItem(cacheKey);

        if (cached) {
            return JSON.parse(cached) as T;
        }

        throw error;
    }
}
