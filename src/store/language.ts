import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AppLanguage = "ru" | "tk";

type LanguageState = {
    language: AppLanguage;
    setLanguage: (language: AppLanguage) => void;
    toggleLanguage: () => void;
};

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: "ru",
            setLanguage: (language) => set({ language }),
            toggleLanguage: () =>
                set({ language: get().language === "ru" ? "tk" : "ru" }),
        }),
        {
            name: "parfum-language",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export function getCurrentLanguage() {
    return useLanguageStore.getState().language;
}
