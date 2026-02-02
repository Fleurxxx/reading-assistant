import {
  cleanExpiredCache,
  db,
  type TranslationCache,
  type TranslationResult,
} from "../storage/db";
import { TRANSLATION_CACHE_EXPIRY_DAYS } from "../utils/constants";

/**
 * Translation caching service to reduce API calls and improve performance
 * Implements cache-aside pattern with automatic expiration
 */
export class TranslationCacheService {
  private memoryCache: Map<string, TranslationResult> = new Map();
  private readonly MEMORY_CACHE_SIZE = 100; // Keep last 100 translations in memory
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Get cached translation if available and not expired
   * @param text - The text to look up
   * @returns Cached translation result or null if not found/expired
   */
  async get(text: string): Promise<TranslationResult | null> {
    const normalizedText = this.normalizeText(text);

    // Check memory cache first (fastest)
    if (this.memoryCache.has(normalizedText)) {
      this.cacheHits++;
      return this.memoryCache.get(normalizedText)!;
    }

    // Check IndexedDB cache
    try {
      const cached = await db.translationCache.get(normalizedText);

      if (!cached) {
        this.cacheMisses++;
        return null;
      }

      // Check if expired
      if (new Date() > cached.expiresAt) {
        // Remove expired entry
        await db.translationCache.delete(normalizedText);
        this.cacheMisses++;
        return null;
      }

      // Add to memory cache for faster subsequent access
      this.addToMemoryCache(normalizedText, cached.result);
      this.cacheHits++;
      return cached.result;
    } catch (error) {
      console.error("Failed to get from translation cache:", error);
      this.cacheMisses++;
      return null;
    }
  }

  /**
   * Store translation result in cache
   * @param text - The original text
   * @param result - The translation result
   * @param expiryDays - Number of days until expiration (default: 30)
   */
  async set(
    text: string,
    result: TranslationResult,
    expiryDays: number = TRANSLATION_CACHE_EXPIRY_DAYS
  ): Promise<void> {
    const normalizedText = this.normalizeText(text);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    const cacheEntry: TranslationCache = {
      text: normalizedText,
      result,
      cachedAt: now,
      expiresAt,
    };

    try {
      // Store in IndexedDB
      await db.translationCache.put(cacheEntry);

      // Store in memory cache
      this.addToMemoryCache(normalizedText, result);
    } catch (error) {
      console.error("Failed to store in translation cache:", error);
    }
  }

  /**
   * Check if a translation is cached
   * @param text - The text to check
   * @returns true if cached and not expired
   */
  async has(text: string): Promise<boolean> {
    const result = await this.get(text);
    return result !== null;
  }

  /**
   * Clear all cached translations
   */
  async clear(): Promise<void> {
    try {
      await db.translationCache.clear();
      this.memoryCache.clear();
      this.resetStats();
    } catch (error) {
      console.error("Failed to clear translation cache:", error);
    }
  }

  /**
   * Remove a specific translation from cache
   * @param text - The text to remove
   */
  async delete(text: string): Promise<void> {
    const normalizedText = this.normalizeText(text);
    try {
      await db.translationCache.delete(normalizedText);
      this.memoryCache.delete(normalizedText);
    } catch (error) {
      console.error("Failed to delete from translation cache:", error);
    }
  }

  /**
   * Clean expired cache entries
   * @returns Number of entries cleaned
   */
  async cleanExpired(): Promise<number> {
    try {
      return await cleanExpiredCache();
    } catch (error) {
      console.error("Failed to clean expired cache:", error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns Object with cache stats
   */
  async getStats(): Promise<{
    totalEntries: number;
    memoryCacheSize: number;
    hitRate: number;
    hits: number;
    misses: number;
  }> {
    let totalEntries = 0;
    try {
      totalEntries = await db.translationCache.count();
    } catch (error) {
      console.error("Failed to get cache count:", error);
    }

    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;

    return {
      totalEntries,
      memoryCacheSize: this.memoryCache.size,
      hitRate,
      hits: this.cacheHits,
      misses: this.cacheMisses,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Add entry to memory cache with LRU eviction
   */
  private addToMemoryCache(text: string, result: TranslationResult): void {
    // Remove oldest entry if cache is full
    if (this.memoryCache.size >= this.MEMORY_CACHE_SIZE) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(text, result);
  }

  /**
   * Normalize text for consistent cache keys
   * Removes extra whitespace and converts to lowercase for case-insensitive matching
   */
  private normalizeText(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, " ");
  }

  /**
   * Pre-warm cache with common words/phrases
   * @param entries - Array of [text, result] pairs to pre-load
   */
  async preload(entries: Array<[string, TranslationResult]>): Promise<void> {
    try {
      const cacheEntries = entries.map(([text, result]) => {
        const now = new Date();
        const expiresAt = new Date(
          now.getTime() + TRANSLATION_CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        );

        return {
          text: this.normalizeText(text),
          result,
          cachedAt: now,
          expiresAt,
        };
      });

      await db.translationCache.bulkPut(cacheEntries);
    } catch (error) {
      console.error("Failed to preload translation cache:", error);
    }
  }

  /**
   * Get all cached entries (for debugging/export)
   */
  async getAllEntries(): Promise<TranslationCache[]> {
    try {
      return await db.translationCache.toArray();
    } catch (error) {
      console.error("Failed to get all cache entries:", error);
      return [];
    }
  }

  /**
   * Get cache size in approximate bytes
   */
  async getSizeEstimate(): Promise<number> {
    try {
      const entries = await db.translationCache.toArray();
      const jsonString = JSON.stringify(entries);
      return new Blob([jsonString]).size;
    } catch (error) {
      console.error("Failed to estimate cache size:", error);
      return 0;
    }
  }
}

// Singleton instance
export const translationCache = new TranslationCacheService();
