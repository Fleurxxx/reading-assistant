import type { TranslationResult } from "../storage/db";

/**
 * Translation adapter interface for different translation services
 * This allows easy switching between translation providers (Youdao, Google, etc.)
 */
export interface TranslationAdapter {
  /**
   * Translate text to target language
   * @param text - Text to translate
   * @param from - Source language code (default: 'en')
   * @param to - Target language code (default: 'zh-CHS')
   * @returns Translation result with translations, phonetics, examples, etc.
   */
  translate(text: string, from?: string, to?: string): Promise<TranslationResult>;

  /**
   * Check if the adapter is properly configured
   * @returns true if adapter has valid credentials/configuration
   */
  isConfigured(): Promise<boolean>;

  /**
   * Get the name/identifier of the translation service
   */
  getServiceName(): string;
}

/**
 * API credentials interface for translation services
 */
export interface ApiCredentials {
  appKey: string;
  appSecret: string;
}

/**
 * Error class for translation-related errors
 */
export class TranslationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "TranslationError";
  }
}

/**
 * Common error codes
 */
export const TranslationErrorCode = {
  NO_CREDENTIALS: "NO_CREDENTIALS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  NETWORK_ERROR: "NETWORK_ERROR",
  API_ERROR: "API_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  TEXT_TOO_LONG: "TEXT_TOO_LONG",
  INVALID_LANGUAGE: "INVALID_LANGUAGE",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;
