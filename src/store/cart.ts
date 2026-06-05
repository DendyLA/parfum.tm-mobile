import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ProductDetail, ProductItem } from "@/services/catalog";

export type CartVariation = {
    id: number;
    label: string;
};

export type CartItem = {
    key: string;
    productId: number;
    slug?: string;
    title: string;
    category: string;
    price: number;
    oldPrice?: number;
    image: string | null;
    quantity: number;
    variation?: CartVariation;
};

type CartInput = ProductItem | ProductDetail;

type CartState = {
    items: CartItem[];
    addItem: (product: CartInput, variation?: CartVariation | null) => void;
    removeItem: (key: string) => void;
    increment: (key: string) => void;
    decrement: (key: string) => void;
    clear: () => void;
    totalQuantity: () => number;
    totalPrice: () => number;
};

export function getCartKey(
    product: CartInput,
    variation?: CartVariation | null
) {
    return `${product.id}:${variation?.id || "default"}`;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product, variation) => {
                const key = getCartKey(product, variation);

                set((state) => {
                    const existingItem = state.items.find(
                        (item) => item.key === key
                    );

                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.key === key
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                        };
                    }

                    return {
                        items: [
                            ...state.items,
                            {
                                key,
                                productId: product.id,
                                slug: product.slug,
                                title: product.title,
                                category: product.category,
                                price: product.price,
                                oldPrice: product.oldPrice,
                                image: product.image,
                                quantity: 1,
                                variation: variation || undefined,
                            },
                        ],
                    };
                });
            },
            removeItem: (key) => {
                set((state) => ({
                    items: state.items.filter((item) => item.key !== key),
                }));
            },
            increment: (key) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.key === key
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                }));
            },
            decrement: (key) => {
                set((state) => ({
                    items: state.items
                        .map((item) =>
                            item.key === key
                                ? { ...item, quantity: item.quantity - 1 }
                                : item
                        )
                        .filter((item) => item.quantity > 0),
                }));
            },
            clear: () => set({ items: [] }),
            totalQuantity: () =>
                get().items.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: () =>
                get().items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                ),
        }),
        {
            name: "parfum-cart",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
