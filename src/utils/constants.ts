// 应用常量
export const APP_NAME = "English Reading Assistant";
export const APP_VERSION = "1.0.0";

// 存储键
export const STORAGE_KEYS = {
  SETTINGS: "era_settings",
  API_CREDENTIALS: "era_api_credentials",
} as const;

// 默认设置
export interface AppSettings {
  autoAnalysis: boolean;
  blacklistDomains: string[];
  whitelistDomains: string[];
  sidePanelPosition: "left" | "right";
  theme: "light" | "dark" | "auto";
  fontSize: number;
  enableShortcuts: boolean;
  language: "zh" | "en";
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoAnalysis: true,
  blacklistDomains: [],
  whitelistDomains: [],
  sidePanelPosition: "right",
  theme: "auto",
  fontSize: 14,
  enableShortcuts: true,
  language: "en",
};

// API 配置
export const YOUDAO_API_URL = "https://openapi.youdao.com/api";
export const TRANSLATION_CACHE_EXPIRY_DAYS = 30;
export const MAX_TRANSLATION_LENGTH = 5000;

// 文本处理
export const MIN_WORD_LENGTH = 2;
export const MAX_WORD_LENGTH = 45;
export const TEXT_EXTRACTION_DEBOUNCE_MS = 200;

// UI
export const SIDE_PANEL_WIDTH = 400;
export const ANIMATION_DURATION_MS = 300;

// 统计
export const TOP_WORDS_LIMIT = 10;
export const STATS_RETENTION_DAYS = 90;
