import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import {
    ArrowLeft,
    Minus,
    Plus,
    ShoppingBag,
    Trash2,
} from "lucide-react-native";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { palette, styles } from "@/features/cart/cart.styles";
import { CartItem, useCartStore } from "@/store/cart";

function formatPrice(value: number) {
    return `${Math.ceil(value)} TMT`;
}

const catalogHref = "/" as Href;

function CartProduct({ item }: { item: CartItem }) {
    const router = useRouter();
    const increment = useCartStore((state) => state.increment);
    const decrement = useCartStore((state) => state.decrement);
    const removeItem = useCartStore((state) => state.removeItem);

    function openProduct() {
        if (item.slug) {
            router.push({
                pathname: "/products/[slug]",
                params: { slug: item.slug },
            });
        }
    }

    return (
        <View style={styles.cartItem}>
            <TouchableOpacity
                activeOpacity={0.82}
                style={styles.itemImageWrap}
                onPress={openProduct}
            >
                {item.image ? (
                    <Image
                        source={{ uri: item.image }}
                        contentFit="contain"
                        style={styles.itemImage}
                    />
                ) : null}
            </TouchableOpacity>

            <View style={styles.itemBody}>
                <View style={styles.itemTopRow}>
                    <TouchableOpacity
                        activeOpacity={0.82}
                        style={{ flex: 1 }}
                        onPress={openProduct}
                    >
                        <ThemedText numberOfLines={2} style={styles.itemTitle}>
                            {item.title}
                        </ThemedText>
                        <ThemedText
                            numberOfLines={1}
                            style={styles.itemCategory}
                        >
                            {item.category}
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        hitSlop={8}
                        activeOpacity={0.76}
                        onPress={() => removeItem(item.key)}
                    >
                        <Trash2
                            color={palette.secondary}
                            size={19}
                            strokeWidth={2.1}
                        />
                    </TouchableOpacity>
                </View>

                {item.variation ? (
                    <View style={styles.itemVariation}>
                        <ThemedText
                            numberOfLines={1}
                            style={styles.itemVariationText}
                        >
                            {item.variation.label}
                        </ThemedText>
                    </View>
                ) : null}

                <View style={styles.itemBottomRow}>
                    <ThemedText style={styles.itemPrice}>
                        {formatPrice(item.price * item.quantity)}
                    </ThemedText>

                    <View style={styles.quantityControl}>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            activeOpacity={0.76}
                            onPress={() => decrement(item.key)}
                        >
                            <Minus
                                color={palette.primary}
                                size={16}
                                strokeWidth={2.3}
                            />
                        </TouchableOpacity>
                        <ThemedText style={styles.quantityText}>
                            {item.quantity}
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            activeOpacity={0.76}
                            onPress={() => increment(item.key)}
                        >
                            <Plus
                                color={palette.primary}
                                size={16}
                                strokeWidth={2.3}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

export default function CartScreen() {
    const router = useRouter();
    const items = useCartStore((state) => state.items);
    const clear = useCartStore((state) => state.clear);
    const totalPrice = useCartStore((state) => state.totalPrice());
    const totalQuantity = useCartStore((state) => state.totalQuantity());

    if (!items.length) {
        return (
            <SafeAreaView style={styles.root}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft
                            color={palette.primary}
                            size={22}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Корзина</ThemedText>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.emptyWrap}>
                    <View style={styles.emptyIcon}>
                        <ShoppingBag
                            color={palette.primary}
                            size={34}
                            strokeWidth={2}
                        />
                    </View>
                    <ThemedText style={styles.emptyTitle}>
                        Корзина пустая
                    </ThemedText>
                    <ThemedText style={styles.emptyText}>
                        Добавьте товары из каталога, и они появятся здесь.
                    </ThemedText>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.continueButton}
                        onPress={() => router.replace(catalogHref)}
                    >
                        <ThemedText style={styles.continueButtonText}>
                            Продолжить покупки
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft
                            color={palette.primary}
                            size={22}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Корзина</ThemedText>
                    <TouchableOpacity hitSlop={8} onPress={clear}>
                        <ThemedText style={styles.clearText}>
                            Очистить
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {items.map((item) => (
                    <CartProduct key={item.key} item={item} />
                ))}
            </ScrollView>

            <View style={styles.bottomBar}>
                <View style={styles.totalRow}>
                    <ThemedText style={styles.totalLabel}>
                        Итого, {totalQuantity} шт.
                    </ThemedText>
                    <ThemedText style={styles.totalPrice}>
                        {formatPrice(totalPrice)}
                    </ThemedText>
                </View>
                <TouchableOpacity
                    activeOpacity={0.86}
                    style={styles.checkoutButton}
                    onPress={() => router.push("/checkout")}
                >
                    <ThemedText style={styles.checkoutButtonText}>
                        Оформить заказ
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.86}
                    style={styles.continueOutlineButton}
                    onPress={() => router.replace(catalogHref)}
                >
                    <ThemedText style={styles.continueOutlineButtonText}>
                        Продолжить покупки
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
