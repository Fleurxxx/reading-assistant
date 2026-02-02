import type { TranslationResult } from "../storage/db";
import { translationCache } from "./translationCache";
import { translationService } from "./translationService";

/**
 * Utilities for testing and debugging the translation service
 */

/**
 * Test translation functionality with common test cases
 */
export async function runTranslationTests(): Promise<void> {
  console.group("Translation Service Tests");

  try {
    // Test 1: Check configuration
    console.log("\n1. Checking configuration...");
    const isConfigured = await translationService.isConfigured();
    console.log(`   Configured: ${isConfigured}`);
    if (!isConfigured) {
      console.warn("   ⚠️  Youdao API credentials not configured");
      console.log(
        "   Please set credentials using: await youdaoTranslator.setCredentials(appKey, appSecret)"
      );
      console.groupEnd();
      return;
    }

    // Test 2: Single word translation
    console.log("\n2. Testing single word translation...");
    console.time("   Translation time");
    const result1 = await translationService.translate("hello");
    console.timeEnd("   Translation time");
    console.log("   Result:", result1);

    // Test 3: Cache hit test
    console.log("\n3. Testing cache hit (same word)...");
    console.time("   Cache hit time");
    const result2 = await translationService.translate("hello");
    console.timeEnd("   Cache hit time");
    console.log("   Result:", result2);

    // Test 4: Phrase translation
    console.log("\n4. Testing phrase translation...");
    const result3 = await translationService.translate("good morning");
    console.log("   Result:", result3);

    // Test 5: Batch translation
    console.log("\n5. Testing batch translation...");
    const words = ["apple", "banana", "orange"];
    console.time("   Batch translation time");
    const batchResults = await translationService.translateBatch(words);
    console.timeEnd("   Batch translation time");
    console.log("   Results:", batchResults);

    // Test 6: Cache statistics
    console.log("\n6. Cache statistics...");
    const stats = await translationService.getCacheStats();
    console.log("   Stats:", {
      totalEntries: stats.totalEntries,
      memoryCacheSize: stats.memoryCacheSize,
      hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
      hits: stats.hits,
      misses: stats.misses,
    });

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }

  console.groupEnd();
}

/**
 * Benchmark translation service performance
 */
export async function benchmarkTranslation(): Promise<void> {
  console.group("Translation Benchmark");

  const testWords = [
    "hello",
    "world",
    "computer",
    "science",
    "technology",
    "artificial",
    "intelligence",
    "machine",
    "learning",
    "programming",
  ];

  try {
    // Clear cache for accurate benchmark
    await translationService.clearCache();

    // Benchmark: Cold cache (API calls)
    console.log("\n📊 Cold Cache Performance (API calls)");
    const coldStartTime = Date.now();
    for (const word of testWords) {
      await translationService.translate(word);
    }
    const coldEndTime = Date.now();
    const coldDuration = coldEndTime - coldStartTime;
    console.log(`   Time: ${coldDuration}ms`);
    console.log(`   Average: ${(coldDuration / testWords.length).toFixed(2)}ms per word`);

    // Benchmark: Warm cache (cache hits)
    console.log("\n📊 Warm Cache Performance (cache hits)");
    const warmStartTime = Date.now();
    for (const word of testWords) {
      await translationService.translate(word);
    }
    const warmEndTime = Date.now();
    const warmDuration = warmEndTime - warmStartTime;
    console.log(`   Time: ${warmDuration}ms`);
    console.log(`   Average: ${(warmDuration / testWords.length).toFixed(2)}ms per word`);
    console.log(`   Speed improvement: ${(coldDuration / warmDuration).toFixed(2)}x faster`);

    // Cache stats
    const stats = await translationService.getCacheStats();
    console.log(`\n📈 Cache Stats:`);
    console.log(`   Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
    console.log(`   Total entries: ${stats.totalEntries}`);

    console.log("\n✅ Benchmark completed!");
  } catch (error) {
    console.error("\n❌ Benchmark failed:", error);
  }

  console.groupEnd();
}

/**
 * Display cache information
 */
export async function showCacheInfo(): Promise<void> {
  console.group("Cache Information");

  try {
    const stats = await translationCache.getStats();
    const size = await translationCache.getSizeEstimate();

    console.log("\n📦 Cache Statistics:");
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Memory cache size: ${stats.memoryCacheSize}`);
    console.log(`   Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
    console.log(`   Cache hits: ${stats.hits}`);
    console.log(`   Cache misses: ${stats.misses}`);
    console.log(`   Estimated size: ${(size / 1024).toFixed(2)} KB`);

    // Get sample entries
    const entries = await translationCache.getAllEntries();
    if (entries.length > 0) {
      console.log("\n📝 Sample Cache Entries (first 5):");
      entries.slice(0, 5).forEach((entry, index) => {
        console.log(`   ${index + 1}. "${entry.text}" → "${entry.result.translation}"`);
        console.log(`      Cached: ${entry.cachedAt.toLocaleString()}`);
        console.log(`      Expires: ${entry.expiresAt.toLocaleString()}`);
      });
    }
  } catch (error) {
    console.error("❌ Failed to get cache info:", error);
  }

  console.groupEnd();
}

/**
 * Pre-load common English words with translations
 */
export async function preloadCommonWords(): Promise<void> {
  console.log("📥 Pre-loading common words...");

  const commonWords: Array<[string, TranslationResult]> = [
    // Common greetings
    ["hello", { translation: "你好", phonetic: "həˈloʊ", explains: ["你好", "您好", "嗨"] }],
    ["hi", { translation: "嗨", phonetic: "haɪ", explains: ["嗨", "你好"] }],
    ["goodbye", { translation: "再见", phonetic: "ɡʊdˈbaɪ", explains: ["再见", "告别"] }],

    // Common verbs
    ["go", { translation: "去", phonetic: "ɡoʊ", explains: ["去", "走", "离开"] }],
    ["come", { translation: "来", phonetic: "kʌm", explains: ["来", "到来"] }],
    ["see", { translation: "看见", phonetic: "siː", explains: ["看见", "看到", "明白"] }],
    ["do", { translation: "做", phonetic: "duː", explains: ["做", "干", "进行"] }],
    ["get", { translation: "得到", phonetic: "ɡet", explains: ["得到", "获得", "变成"] }],
    ["make", { translation: "制造", phonetic: "meɪk", explains: ["制造", "做", "使得"] }],
    ["know", { translation: "知道", phonetic: "noʊ", explains: ["知道", "了解", "认识"] }],

    // Common nouns
    ["time", { translation: "时间", phonetic: "taɪm", explains: ["时间", "时刻", "次数"] }],
    ["person", { translation: "人", phonetic: "ˈpɜːrsn", explains: ["人", "人物", "个人"] }],
    ["year", { translation: "年", phonetic: "jɪr", explains: ["年", "年度", "岁"] }],
    ["day", { translation: "天", phonetic: "deɪ", explains: ["天", "日", "白天"] }],
    ["thing", { translation: "事情", phonetic: "θɪŋ", explains: ["事情", "东西", "事物"] }],
  ];

  try {
    await translationService.preloadCache(commonWords);
    console.log(`✅ Pre-loaded ${commonWords.length} common words`);
  } catch (error) {
    console.error("❌ Failed to pre-load words:", error);
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupCache(): Promise<void> {
  console.log("🧹 Cleaning up expired cache entries...");
  try {
    const cleaned = await translationService.cleanExpiredCache();
    console.log(`✅ Cleaned ${cleaned} expired entries`);
  } catch (error) {
    console.error("❌ Failed to clean cache:", error);
  }
}

/**
 * Export cache to JSON for backup
 */
export async function exportCache(): Promise<string> {
  console.log("💾 Exporting cache...");
  try {
    const entries = await translationCache.getAllEntries();
    const json = JSON.stringify(entries, null, 2);
    console.log(`✅ Exported ${entries.length} cache entries`);
    return json;
  } catch (error) {
    console.error("❌ Failed to export cache:", error);
    return "[]";
  }
}

/**
 * Show service information
 */
export function showServiceInfo(): void {
  console.group("Translation Service Info");
  console.log(`Service: ${translationService.getAdapterName()}`);
  console.log("Cache: Two-tier (Memory + IndexedDB)");
  console.log("Memory cache size: 100 entries (LRU)");
  console.log("Cache expiry: 30 days");
  console.log("Max text length: 5000 characters");
  console.log("Rate limiting: 100ms between requests");
  console.groupEnd();
}

// Make utilities available in browser console for debugging
if (typeof window !== "undefined") {
  (window as any).translationTests = {
    run: runTranslationTests,
    benchmark: benchmarkTranslation,
    showCache: showCacheInfo,
    preload: preloadCommonWords,
    cleanup: cleanupCache,
    export: exportCache,
    info: showServiceInfo,
  };

  console.log("%c🔧 Translation Test Utilities Loaded", "color: #4CAF50; font-weight: bold");
  console.log("Available commands:");
  console.log("  translationTests.run()       - Run all tests");
  console.log("  translationTests.benchmark() - Run performance benchmark");
  console.log("  translationTests.showCache() - Show cache information");
  console.log("  translationTests.preload()   - Pre-load common words");
  console.log("  translationTests.cleanup()   - Clean expired cache");
  console.log("  translationTests.export()    - Export cache to JSON");
  console.log("  translationTests.info()      - Show service info");
}
