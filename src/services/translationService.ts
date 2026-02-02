import type { TranslationResult } from "../storage/db";
import { type TranslationAdapter, TranslationError } from "./translationAdapter";
import { translationCache } from "./translationCache";
import { youdaoTranslator } from "./youdaoTranslator";

/**
 * Main translation service that combines adapter with caching layer
 * Implements cache-first strategy with automatic fallback to API
 */
export class TranslationService {
  private adapter: TranslationAdapter;

  constructor(adapter: TranslationAdapter = youdaoTranslator) {
    this.adapter = adapter;
  }

  /**
   * Translate text with caching
   * Checks cache first, falls back to API if not found
   * @param text - Text to translate
   * @param from - Source language (default: 'en')
   * @param to - Target language (default: 'zh-CHS')
   * @returns Translation result
   */
  async translate(
    text: string,
    from: string = "en",
    to: string = "zh-CHS"
  ): Promise<TranslationResult> {
    if (!text || text.trim().length === 0) {
      throw new TranslationError("Text cannot be empty", "INVALID_INPUT");
    }

    // Check cache first
    const cached = await translationCache.get(text);
    if (cached) {
      console.log(`[TranslationService] Cache hit for: ${text.substring(0, 50)}...`);
      return cached;
    }

    console.log(
      `[TranslationService] Cache miss, fetching from API for: ${text.substring(0, 50)}...`
    );

    // Fetch from API
    try {
      const result = await this.adapter.translate(text, from, to);

      // Store in cache for future use
      await translationCache.set(text, result);

      return result;
    } catch (error) {
      console.error("[TranslationService] Translation failed:", error);
      throw error;
    }
  }

  /**
   * Batch translate multiple texts
   * @param texts - Array of texts to translate
   * @param from - Source language
   * @param to - Target language
   * @returns Array of translation results (in same order as input)
   */
  async translateBatch(
    texts: string[],
    from: string = "en",
    to: string = "zh-CHS"
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];

    for (const text of texts) {
      try {
        const result = await this.translate(text, from, to);
        results.push(result);
      } catch (error) {
        console.error(`Failed to translate: ${text}`, error);
        // Push error result or empty result
        results.push({
          translation: "",
          phonetic: "",
          explains: [],
        });
      }
    }

    return results;
  }

  /**
   * Check if the translation service is properly configured
   */
  async isConfigured(): Promise<boolean> {
    return this.adapter.isConfigured();
  }

  /**
   * Get the name of the current translation adapter
   */
  getAdapterName(): string {
    return this.adapter.getServiceName();
  }

  /**
   * Change the translation adapter
   * @param adapter - New adapter to use
   */
  setAdapter(adapter: TranslationAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Clear all cached translations
   */
  async clearCache(): Promise<void> {
    await translationCache.clear();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return translationCache.getStats();
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    return translationCache.cleanExpired();
  }

  /**
   * Pre-warm cache with common words/phrases
   * @param entries - Array of [text, result] pairs
   */
  async preloadCache(entries: Array<[string, TranslationResult]>): Promise<void> {
    await translationCache.preload(entries);
  }
}

// Singleton instance
export const translationService = new TranslationService();

/**
 * Convenience function to translate text using the singleton service
 * @param text - Text to translate
 * @param from - Source language (default: 'en')
 * @param to - Target language (default: 'zh-CHS')
 * @returns Translation result
 */
export async function translateText(
  text: string,
  from: string = "en",
  to: string = "zh-CHS"
): Promise<TranslationResult> {
  return translationService.translate(text, from, to);
}
