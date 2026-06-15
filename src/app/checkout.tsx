import NetInfo from "@react-native-community/netinfo";
import { Href, useRouter } from "expo-router";
import { ArrowLeft, Check, ShoppingCart } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { palette, styles } from "@/features/checkout/checkout.styles";
import { useTranslations } from "@/i18n";
import { createOrder } from "@/services/orders";
import { useCartStore } from "@/store/cart";

function formatPrice(value: number) {
    return `${Math.ceil(value)} TMT`;
}

const catalogHref = "/" as Href;

function isValidPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
}

function isOffline(isConnected: boolean | null, isInternetReachable: boolean | null) {
    return isConnected === false || isInternetReachable === false;
}

export default function CheckoutScreen() {
    const router = useRouter();
    const t = useTranslations();
    const items = useCartStore((state) => state.items);
    const clear = useCartStore((state) => state.clear);
    const totalPrice = useCartStore((state) => state.totalPrice());
    const totalQuantity = useCartStore((state) => state.totalQuantity());

    const [firstName, setFirstName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

    const canSubmit = Boolean(
        firstName.trim() &&
            phone.trim() &&
            address.trim() &&
            items.length &&
            !submitting
    );

    async function submitOrder() {
        if (!items.length) {
            setError(t("orderEmptyCart"));
            return;
        }

        if (!firstName.trim() || !phone.trim() || !address.trim()) {
            setError(t("orderRequiredFields"));
            return;
        }

        if (!isValidPhone(phone)) {
            setError(t("orderPhoneInvalid"));
            return;
        }

        const networkState = await NetInfo.fetch();
        if (
            isOffline(
                networkState.isConnected,
                networkState.isInternetReachable
            )
        ) {
            setError(t("orderNeedsInternet"));
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const response = await createOrder({
                firstName,
                phone,
                address,
                comment,
                items,
                totalPrice,
            });

            clear();
            setCreatedOrderId(response.order_id);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : t("orderFailed")
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (!items.length && !createdOrderId) {
        return (
            <SafeAreaView style={styles.root}>
                <View style={styles.successWrap}>
                    <View style={styles.emptyIcon}>
                        <ShoppingCart
                            color={palette.primary}
                            size={34}
                            strokeWidth={2}
                        />
                    </View>
                    <ThemedText style={styles.successTitle}>
                        {t("cartEmpty")}
                    </ThemedText>
                    <ThemedText style={styles.successText}>
                        {t("cartEmptyCheckout")}
                    </ThemedText>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.submitButton}
                        onPress={() => router.replace(catalogHref)}
                    >
                        <ThemedText style={styles.submitButtonText}>
                            {t("goToCatalog")}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (createdOrderId) {
        return (
            <SafeAreaView style={styles.root}>
                <View style={styles.successWrap}>
                    <View style={styles.successIcon}>
                        <Check
                            color={palette.success}
                            size={38}
                            strokeWidth={2.4}
                        />
                    </View>
                    <ThemedText style={styles.successTitle}>
                        {t("orderAccepted")}
                    </ThemedText>
                    <ThemedText style={styles.successText}>
                        {t("orderConfirmPrefix")}
                        {createdOrderId}
                        {t("orderConfirmSuffix")}
                    </ThemedText>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.submitButton}
                        onPress={() => router.replace(catalogHref)}
                    >
                        <ThemedText style={styles.submitButtonText}>
                            {t("goToCatalog")}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.root}
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
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
                        <ThemedText style={styles.headerTitle}>
                            {t("checkout")}
                        </ThemedText>
                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            {t("contacts")}
                        </ThemedText>

                        <View style={styles.field}>
                            <ThemedText style={styles.label}>{t("name")}</ThemedText>
                            <TextInput
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder={t("namePlaceholder")}
                                placeholderTextColor={palette.secondary}
                                style={styles.input}
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={styles.label}>
                                {t("phone")}
                            </ThemedText>
                            <TextInput
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+993..."
                                placeholderTextColor={palette.secondary}
                                style={styles.input}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={styles.label}>
                                {t("address")}
                            </ThemedText>
                            <TextInput
                                value={address}
                                onChangeText={setAddress}
                                placeholder={t("addressPlaceholder")}
                                placeholderTextColor={palette.secondary}
                                style={[styles.input, styles.multilineInput]}
                                multiline
                            />
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={styles.label}>
                                {t("comment")}
                            </ThemedText>
                            <TextInput
                                value={comment}
                                onChangeText={setComment}
                                placeholder={t("commentPlaceholder")}
                                placeholderTextColor={palette.secondary}
                                style={[styles.input, styles.multilineInput]}
                                multiline
                            />
                        </View>

                        {error ? (
                            <ThemedText style={styles.errorText}>
                                {error}
                            </ThemedText>
                        ) : null}
                    </View>

                    <View style={styles.orderPreview}>
                        <View style={styles.previewRow}>
                            <ThemedText style={styles.previewLabel}>
                                {t("products")}
                            </ThemedText>
                            <ThemedText style={styles.previewValue}>
                                {totalQuantity} {t("pieces")}
                            </ThemedText>
                        </View>
                        <View style={styles.previewRow}>
                            <ThemedText style={styles.previewLabel}>
                                {t("subtotal")}
                            </ThemedText>
                            <ThemedText style={styles.previewValue}>
                                {formatPrice(totalPrice)}
                            </ThemedText>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                    <View style={styles.totalRow}>
                        <ThemedText style={styles.totalLabel}>
                            {t("orderTotal")}
                        </ThemedText>
                        <ThemedText style={styles.totalPrice}>
                            {formatPrice(totalPrice)}
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        disabled={!canSubmit}
                        style={[
                            styles.submitButton,
                            !canSubmit && styles.submitButtonDisabled,
                        ]}
                        onPress={submitOrder}
                    >
                        {submitting ? (
                            <ActivityIndicator color={palette.surface} />
                        ) : (
                            <ThemedText style={styles.submitButtonText}>
                                {t("checkoutSubmit")}
                            </ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
