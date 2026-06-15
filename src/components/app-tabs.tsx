import { Tabs } from "expo-router";
import { Grid3X3, Heart, Home, ShoppingCart } from "lucide-react-native";
import { ColorValue, DeviceEventEmitter } from "react-native";

import { useCartStore } from "@/store/cart";
import { useFavoriteStore } from "@/store/favorites";
import { useTranslations } from "@/i18n";

const palette = {
    primary: "#212121",
    secondary: "#8c8c8c",
    border: "#e4e4e4",
    sale: "#ea4040",
    surface: "#ffffff",
};

type TabIconProps = {
    color: ColorValue;
    size: number;
};

function iconColor(color: ColorValue) {
    return String(color);
}

export default function AppTabs() {
    const t = useTranslations();
    const cartItems = useCartStore((state) => state.items);
    const favoriteItems = useFavoriteStore((state) => state.items);
    const totalQuantity = cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
    );
    const totalFavorites = favoriteItems.length;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: palette.primary,
                tabBarInactiveTintColor: palette.secondary,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    height: 84,
                    borderTopColor: palette.border,
                    backgroundColor: palette.surface,
                    paddingTop: 8,
                    paddingBottom: 14,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    lineHeight: 13,
                    fontWeight: "600",
                    marginTop: 3,
                },
                tabBarBadgeStyle: {
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: palette.sale,
                    color: palette.surface,
                    fontSize: 10,
                    fontWeight: "800",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t("home"),
                    tabBarIcon: ({ color, size }: TabIconProps) => (
                        <Home
                            color={iconColor(color)}
                            size={Math.min(size, 22)}
                            strokeWidth={2}
                        />
                    ),
                }}
                listeners={{
                    tabPress: () => {
                        DeviceEventEmitter.emit("homeTabPressed");
                    },
                }}
            />
            <Tabs.Screen
                name="categories"
                options={{
                    title: t("categories"),
                    tabBarIcon: ({ color, size }: TabIconProps) => (
                        <Grid3X3
                            color={iconColor(color)}
                            size={Math.min(size, 22)}
                            strokeWidth={2}
                        />
                    ),
                }}
                listeners={{
                    tabPress: () => {
                        DeviceEventEmitter.emit("categoriesTabPressed");
                    },
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    tabBarBadge: totalFavorites > 0 ? String(totalFavorites) : undefined,
                    title: t("favorites"),
                    tabBarIcon: ({ color, size }: TabIconProps) => (
                        <Heart
                            color={iconColor(color)}
                            size={Math.min(size, 22)}
                            strokeWidth={2}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    tabBarBadge: totalQuantity > 0 ? String(totalQuantity) : undefined,
                    title: t("cart"),
                    tabBarIcon: ({ color, size }: TabIconProps) => (
                        <ShoppingCart
                            color={iconColor(color)}
                            size={Math.min(size, 22)}
                            strokeWidth={2}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

