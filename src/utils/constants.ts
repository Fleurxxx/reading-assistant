// App constants
export const APP_NAME = "English Reading Assistant";
export const APP_VERSION = "1.0.0";

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: "era_settings",
  API_CREDENTIALS: "era_api_credentials",
} as const;

// Default settings
export interface AppSettings {
  autoAnalysis: boolean;
  blacklistDomains: string[];
  whitelistDomains: string[];
  sidePanelPosition: "left" | "right";
  theme: "light" | "dark" | "auto";
  fontSize: number;
  enableShortcuts: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoAnalysis: true,
  blacklistDomains: [],
  whitelistDomains: [],
  sidePanelPosition: "right",
  theme: "auto",
  fontSize: 14,
  enableShortcuts: true,
};

// API Configuration
export const YOUDAO_API_URL = "https://openapi.youdao.com/api";
export const TRANSLATION_CACHE_EXPIRY_DAYS = 30;
export const MAX_TRANSLATION_LENGTH = 5000;

// Text processing
export const MIN_WORD_LENGTH = 2;
export const MAX_WORD_LENGTH = 45;
export const TEXT_EXTRACTION_DEBOUNCE_MS = 200;

// UI
export const SIDE_PANEL_WIDTH = 400;
export const ANIMATION_DURATION_MS = 300;

// Statistics
export const TOP_WORDS_LIMIT = 10;
export const STATS_RETENTION_DAYS = 90;
