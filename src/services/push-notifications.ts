import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { apiPost } from "./api";

export type PushNotificationData = {
    promotionId?: string | number | null;
    type?: string;
};

type NotificationsModule = typeof import("expo-notifications");

let notificationHandlerConfigured = false;
const PUSH_STATUS_KEY = "parfum-push-registration-status";

export type PushRegistrationStatus = {
    status:
        | "idle"
        | "checking"
        | "skipped"
        | "permission-denied"
        | "token-received"
        | "registered"
        | "failed";
    message: string;
    updatedAt: string;
    tokenPreview?: string;
    permissionStatus?: string;
    appOwnership?: string | null;
    executionEnvironment?: string | null;
    isDevice?: boolean;
    projectId?: string | null;
};

async function setPushStatus(
    update: Omit<PushRegistrationStatus, "updatedAt">
) {
    await AsyncStorage.setItem(
        PUSH_STATUS_KEY,
        JSON.stringify({
            ...update,
            updatedAt: new Date().toISOString(),
        })
    );
}

export async function getPushRegistrationStatus() {
    const rawStatus = await AsyncStorage.getItem(PUSH_STATUS_KEY);
    if (!rawStatus) return null;
    return JSON.parse(rawStatus) as PushRegistrationStatus;
}

function isExpoGo() {
    return (
        Constants.appOwnership === "expo" ||
        Constants.executionEnvironment === "storeClient"
    );
}

async function getNotificationsModule() {
    if (isExpoGo()) {
        return null;
    }

    return (await import("expo-notifications")) as NotificationsModule;
}

async function configureNotificationHandler(
    Notifications: NotificationsModule
) {
    if (notificationHandlerConfigured) return;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
    notificationHandlerConfigured = true;
}

function getProjectId() {
    return (
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId
    );
}

function getAppVersion() {
    return Constants.expoConfig?.version || "1.0.0";
}

function getDeviceId() {
    return [
        Device.osName,
        Device.osVersion,
        Device.modelName,
        Device.osBuildId,
    ]
        .filter(Boolean)
        .join(":");
}

export function getPromotionIdFromNotificationData(
    data: Record<string, unknown> | PushNotificationData | null | undefined
) {
    const promotionId = data?.promotionId;
    if (typeof promotionId === "number") return String(promotionId);
    if (typeof promotionId === "string" && promotionId.trim()) {
        return promotionId.trim();
    }
    return null;
}

export async function registerForPushNotifications() {
    await setPushStatus({
        status: "checking",
        message: "Checking push notification support.",
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment,
        isDevice: Device.isDevice,
        projectId: getProjectId() || null,
    });

    const Notifications = await getNotificationsModule();
    if (!Notifications) {
        await setPushStatus({
            status: "skipped",
            message:
                "Push registration skipped: Expo Go does not support Android remote push notifications.",
            appOwnership: Constants.appOwnership,
            executionEnvironment: Constants.executionEnvironment,
            isDevice: Device.isDevice,
            projectId: getProjectId() || null,
        });
        console.info(
            "Push notifications are skipped in Expo Go. Use a development build to test remote pushes."
        );
        return null;
    }

    await configureNotificationHandler(Notifications);

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "Parfum TM",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#212121",
        });
    }

    if (!Device.isDevice) {
        await setPushStatus({
            status: "skipped",
            message:
                "Push registration skipped: Expo push tokens require a real physical device.",
            appOwnership: Constants.appOwnership,
            executionEnvironment: Constants.executionEnvironment,
            isDevice: Device.isDevice,
            projectId: getProjectId() || null,
        });
        return null;
    }

    const existingPermission = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermission.status;

    if (existingPermission.status !== "granted") {
        const requestedPermission =
            await Notifications.requestPermissionsAsync();
        finalStatus = requestedPermission.status;
    }

    if (finalStatus !== "granted") {
        await setPushStatus({
            status: "permission-denied",
            message: "Notification permission is not granted.",
            permissionStatus: finalStatus,
            appOwnership: Constants.appOwnership,
            executionEnvironment: Constants.executionEnvironment,
            isDevice: Device.isDevice,
            projectId: getProjectId() || null,
        });
        return null;
    }

    const projectId = getProjectId();
    if (!projectId) {
        await setPushStatus({
            status: "failed",
            message:
                "Expo projectId is missing. Check app.json extra.eas.projectId.",
            permissionStatus: finalStatus,
            appOwnership: Constants.appOwnership,
            executionEnvironment: Constants.executionEnvironment,
            isDevice: Device.isDevice,
            projectId: null,
        });
        return null;
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId,
    });
    const token = tokenResult.data;

    await setPushStatus({
        status: "token-received",
        message: "Expo push token received. Sending it to backend.",
        tokenPreview: token.slice(0, 32),
        permissionStatus: finalStatus,
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment,
        isDevice: Device.isDevice,
        projectId,
    });

    try {
        await apiPost("/mobile/push-tokens/", {
            token,
            platform: Platform.OS,
            deviceId: getDeviceId(),
            deviceName: Device.modelName || "",
            appVersion: getAppVersion(),
            permissionStatus: finalStatus,
            locale: "ru",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
    } catch (error) {
        await setPushStatus({
            status: "failed",
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to send Expo push token to backend.",
            tokenPreview: token.slice(0, 32),
            permissionStatus: finalStatus,
            appOwnership: Constants.appOwnership,
            executionEnvironment: Constants.executionEnvironment,
            isDevice: Device.isDevice,
            projectId,
        });
        throw error;
    }

    await setPushStatus({
        status: "registered",
        message: "Expo push token was saved on backend.",
        tokenPreview: token.slice(0, 32),
        permissionStatus: finalStatus,
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment,
        isDevice: Device.isDevice,
        projectId,
    });

    return token;
}

export async function subscribeToPromotionPushClicks(
    onPromotionPress: (promotionId: string) => void
) {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
        return () => undefined;
    }

    await configureNotificationHandler(Notifications);

    const subscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
            const promotionId = getPromotionIdFromNotificationData(
                response.notification.request.content.data
            );

            if (promotionId) {
                onPromotionPress(promotionId);
            }
        });

    const lastResponse =
        await Notifications.getLastNotificationResponseAsync();
    const promotionId = getPromotionIdFromNotificationData(
        lastResponse?.notification.request.content.data
    );

    if (promotionId) {
        onPromotionPress(promotionId);
    }

    return () => {
        subscription.remove();
    };
}
