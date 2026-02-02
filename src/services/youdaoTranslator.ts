import CryptoJS from "crypto-js";
import type { TranslationResult } from "../storage/db";
import { MAX_TRANSLATION_LENGTH, STORAGE_KEYS, YOUDAO_API_URL } from "../utils/constants";
import {
  type ApiCredentials,
  type TranslationAdapter,
  TranslationError,
  TranslationErrorCode,
} from "./translationAdapter";

/**
 * Youdao translation API response interface
 */
interface YoudaoApiResponse {
  errorCode: string;
  query?: string;
  translation?: string[];
  basic?: {
    phonetic?: string;
    "uk-phonetic"?: string;
    "us-phonetic"?: string;
    explains?: string[];
  };
  web?: Array<{
    key: string;
    value: string[];
  }>;
  l?: string;
  dict?: {
    url: string;
  };
  webdict?: {
    url: string;
  };
}

/**
 * Youdao API error codes mapping
 */
const YOUDAO_ERROR_CODES: Record<string, string> = {
  "101": "Missing required parameters",
  "102": "Unsupported language type",
  "103": "Text too long",
  "104": "Unsupported API type",
  "105": "Unsupported signature type",
  "106": "Unsupported response type",
  "107": "Unsupported encoding type",
  "108": "Unsupported encryption type",
  "109": "Unsupported IP address",
  "110": "Access frequency limited",
  "111": "Invalid account",
  "112": "Service is not enabled",
  "113": "Insufficient account balance",
  "201": "Decryption failed",
  "202": "Invalid signature",
  "203": "Access IP restricted",
  "301": "Dictionary query failed",
  "302": "Translation query failed",
  "303": "Service timeout",
  "401": "Account has been blocked",
};

/**
 * Youdao Translation API implementation
 * Supports English to Chinese translation with detailed results
 */
export class YoudaoTranslator implements TranslationAdapter {
  private credentials: ApiCredentials | null = null;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private readonly REQUEST_DELAY_MS = 100; // Delay between requests to avoid rate limiting

  constructor() {
    this.loadCredentials();
  }

  getServiceName(): string {
    return "Youdao";
  }

  /**
   * Load API credentials from Chrome storage
   */
  private async loadCredentials(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.API_CREDENTIALS);
      if (result[STORAGE_KEYS.API_CREDENTIALS]) {
        this.credentials = result[STORAGE_KEYS.API_CREDENTIALS];
      }
    } catch (error) {
      console.error("Failed to load Youdao credentials:", error);
    }
  }

  /**
   * Save API credentials to Chrome storage
   */
  async setCredentials(appKey: string, appSecret: string): Promise<void> {
    this.credentials = { appKey, appSecret };
    await chrome.storage.local.set({
      [STORAGE_KEYS.API_CREDENTIALS]: this.credentials,
    });
  }

  /**
   * Check if credentials are configured
   */
  async isConfigured(): Promise<boolean> {
    if (!this.credentials) {
      await this.loadCredentials();
    }
    return !!(this.credentials?.appKey && this.credentials?.appSecret);
  }

  /**
   * Generate signature for Youdao API request
   * Sign = MD5(appKey + input + salt + curtime + appSecret)
   */
  private generateSignature(
    appKey: string,
    appSecret: string,
    query: string,
    salt: string,
    curtime: string
  ): string {
    // Truncate input for signature
    let input: string;
    const len = query.length;
    if (len <= 20) {
      input = query;
    } else {
      input = query.substring(0, 10) + len + query.substring(len - 10);
    }

    const signStr = appKey + input + salt + curtime + appSecret;
    return CryptoJS.SHA256(signStr).toString(CryptoJS.enc.Hex);
  }

  /**
   * Translate text using Youdao API
   */
  async translate(
    text: string,
    from: string = "en",
    to: string = "zh-CHS"
  ): Promise<TranslationResult> {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new TranslationError("Text cannot be empty", TranslationErrorCode.INVALID_LANGUAGE);
    }

    if (text.length > MAX_TRANSLATION_LENGTH) {
      throw new TranslationError(
        `Text exceeds maximum length of ${MAX_TRANSLATION_LENGTH} characters`,
        TranslationErrorCode.TEXT_TOO_LONG
      );
    }

    // Check credentials
    if (!this.credentials) {
      await this.loadCredentials();
    }

    if (!this.credentials?.appKey || !this.credentials?.appSecret) {
      throw new TranslationError(
        "Youdao API credentials not configured",
        TranslationErrorCode.NO_CREDENTIALS
      );
    }

    // Queue the request to avoid rate limiting
    return this.queueRequest(() => this.executeTranslation(text, from, to));
  }

  /**
   * Execute translation request with rate limiting via queue
   */
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process request queue with delay between requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
        // Add delay between requests
        if (this.requestQueue.length > 0) {
          await this.delay(this.REQUEST_DELAY_MS);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute the actual translation API call
   */
  private async executeTranslation(
    text: string,
    from: string,
    to: string
  ): Promise<TranslationResult> {
    if (!this.credentials) {
      throw new TranslationError("Credentials not loaded", TranslationErrorCode.NO_CREDENTIALS);
    }

    const { appKey, appSecret } = this.credentials;
    const salt = Date.now().toString();
    const curtime = Math.round(Date.now() / 1000).toString();
    const sign = this.generateSignature(appKey, appSecret, text, salt, curtime);

    // Build request parameters
    const params = new URLSearchParams({
      q: text,
      from,
      to,
      appKey,
      salt,
      sign,
      signType: "v3",
      curtime,
    });

    try {
      const response = await fetch(YOUDAO_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!response.ok) {
        throw new TranslationError(
          `HTTP error: ${response.status}`,
          TranslationErrorCode.NETWORK_ERROR,
          { status: response.status }
        );
      }

      const data: YoudaoApiResponse = await response.json();

      // Check for API errors
      if (data.errorCode !== "0") {
        const errorMessage =
          YOUDAO_ERROR_CODES[data.errorCode] || `Unknown error: ${data.errorCode}`;

        let errorCode: string = TranslationErrorCode.API_ERROR;
        if (data.errorCode === "110") {
          errorCode = TranslationErrorCode.RATE_LIMIT;
        } else if (data.errorCode === "103") {
          errorCode = TranslationErrorCode.TEXT_TOO_LONG;
        } else if (data.errorCode === "102") {
          errorCode = TranslationErrorCode.INVALID_LANGUAGE;
        } else if (["111", "112", "113", "202", "401"].includes(data.errorCode)) {
          errorCode = TranslationErrorCode.INVALID_CREDENTIALS;
        }

        throw new TranslationError(errorMessage, errorCode, {
          youdaoErrorCode: data.errorCode,
        });
      }

      // Parse and return result
      return this.parseYoudaoResponse(data);
    } catch (error) {
      if (error instanceof TranslationError) {
        throw error;
      }

      // Network or other errors
      throw new TranslationError(
        error instanceof Error ? error.message : "Unknown error occurred",
        TranslationErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Parse Youdao API response into TranslationResult format
   */
  private parseYoudaoResponse(data: YoudaoApiResponse): TranslationResult {
    const result: TranslationResult = {
      translation: data.translation?.[0] || "",
    };

    // Add phonetic information (prefer UK/US phonetic, fallback to generic)
    if (data.basic) {
      result.phonetic =
        data.basic["uk-phonetic"] || data.basic["us-phonetic"] || data.basic.phonetic;
      result.explains = data.basic.explains || [];
    }

    // Add web translations
    if (data.web && data.web.length > 0) {
      result.webTranslations = data.web.map((item) => ({
        key: item.key,
        value: item.value,
      }));
    }

    // Generate example sentences from web translations if available
    if (result.webTranslations && result.webTranslations.length > 0) {
      result.examples = result.webTranslations
        .slice(0, 3)
        .map((wt) => `${wt.key}: ${wt.value.join(", ")}`);
    }

    return result;
  }
}

// Singleton instance
export const youdaoTranslator = new YoudaoTranslator();
