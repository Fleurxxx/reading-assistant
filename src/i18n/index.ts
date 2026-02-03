import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../utils/constants";
import enLocale from "./locales/en.json";
import zhLocale from "./locales/zh.json";

// 支持的语言类型
export type Language = "zh" | "en";

// 自动从 en.json 推导翻译类型，无需手写！
export type Translations = typeof enLocale;

// 语言配置映射
const locales: Record<Language, Translations> = {
  zh: zhLocale,
  en: enLocale,
};

/**
 * 获取指定语言的翻译内容
 */
export function getTranslations(language: Language): Translations {
  return locales[language] || locales.en;
}

/**
 * 获取当前语言设置
 */
export async function getCurrentLanguage(): Promise<Language> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = result[STORAGE_KEYS.SETTINGS];
    return settings?.language || "en";
  } catch (error) {
    console.error("Failed to get language:", error);
    return "en";
  }
}

/**
 * 设置当前语言
 */
export async function setCurrentLanguage(language: Language): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = result[STORAGE_KEYS.SETTINGS] || {};
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: {
        ...settings,
        language,
      },
    });
  } catch (error) {
    console.error("Failed to set language:", error);
  }
}

/**
 * React Hook for i18n
 * 使用方法：const { t, language, setLanguage } = useTranslation();
 */
export function useTranslation() {
  const [language, setLanguageState] = useState<Language>("en");
  const [translations, setTranslations] = useState<Translations>(getTranslations("en"));

  const updateLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setTranslations(getTranslations(lang));
  }, []);

  const loadLanguage = useCallback(async () => {
    const lang = await getCurrentLanguage();
    updateLanguage(lang);
  }, [updateLanguage]);

  useEffect(() => {
    // 初始化时加载语言设置
    loadLanguage();

    // 监听语言设置变化
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes[STORAGE_KEYS.SETTINGS]) {
        const newSettings = changes[STORAGE_KEYS.SETTINGS].newValue;
        if (newSettings?.language) {
          updateLanguage(newSettings.language);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadLanguage, updateLanguage]);

  const setLanguage = async (lang: Language) => {
    await setCurrentLanguage(lang);
    updateLanguage(lang);
  };

  return {
    t: translations,
    language,
    setLanguage,
  };
}
