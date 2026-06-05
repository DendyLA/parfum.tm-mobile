import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ProductItem } from "@/services/catalog";

type FavoriteState = {
    items: ProductItem[];
    toggleFavorite: (product: ProductItem) => void;
    removeFavorite: (productId: number) => void;
    isFavorite: (productId: number) => boolean;
    totalFavorites: () => number;
};

export const useFavoriteStore = create<FavoriteState>()(
    persist(
        (set, get) => ({
            items: [],
            toggleFavorite: (product) => {
                set((state) => {
                    const exists = state.items.some(
                        (item) => item.id === product.id
                    );

                    if (exists) {
                        return {
                            items: state.items.filter(
                                (item) => item.id !== product.id
                            ),
                        };
                    }

                    return { items: [product, ...state.items] };
                });
            },
            removeFavorite: (productId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== productId),
                }));
            },
            isFavorite: (productId) =>
                get().items.some((item) => item.id === productId),
            totalFavorites: () => get().items.length,
        }),
        {
            name: "parfum-favorites",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
