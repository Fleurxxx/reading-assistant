/**
 * Testing and debugging utilities
 * These utilities help test the extension on various sites and scenarios
 */

import { perfMonitor } from "./performance";

/**
 * Test suite interface
 */
export interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  error?: string;
  details?: any;
}

/**
 * Test runner class
 */
export class ExtensionTester {
  private results: TestResult[] = [];

  /**
   * Run a single test
   */
  async runTest(name: string, testFn: () => Promise<boolean> | boolean): Promise<TestResult> {
    console.log(`[Test] Running: ${name}`);
    const startTime = performance.now();

    try {
      const passed = await testFn();
      const duration = performance.now() - startTime;

      const result: TestResult = {
        name,
        status: passed ? "pass" : "fail",
        duration,
      };

      this.results.push(result);
      console.log(`[Test] ${result.status.toUpperCase()}: ${name} (${duration.toFixed(2)}ms)`);
      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const result: TestResult = {
        name,
        status: "fail",
        duration,
        error: error.message,
      };

      this.results.push(result);
      console.error(`[Test] FAIL: ${name}`, error);
      return result;
    }
  }

  /**
   * Get all test results
   */
  getResults(): TestResult[] {
    return this.results;
  }

  /**
   * Print summary
   */
  printSummary(): void {
    const passed = this.results.filter((r) => r.status === "pass").length;
    const failed = this.results.filter((r) => r.status === "fail").length;
    const total = this.results.length;

    console.log("\n[Test Summary]");
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log("\nFailed Tests:");
      this.results
        .filter((r) => r.status === "fail")
        .forEach((r) => {
          console.log(`- ${r.name}: ${r.error || "Unknown error"}`);
        });
    }
  }

  /**
   * Clear results
   */
  clear(): void {
    this.results = [];
  }
}

/**
 * Test text extraction performance
 */
export async function testTextExtraction(): Promise<boolean> {
  const { extractMainContent } = await import("../content/textExtractor");

  const end = perfMonitor.startTimer("TextExtraction");
  const text = extractMainContent();
  end();

  return text.length > 0;
}

/**
 * Test text processing performance
 */
export async function testTextProcessing(): Promise<boolean> {
  const { analyzeText } = await import("../core/textProcessor");

  const sampleText = "The quick brown fox jumps over the lazy dog. ".repeat(100);

  const end = perfMonitor.startTimer("TextProcessing");
  const result = analyzeText(sampleText, "test.com");
  end();

  return result.totalWords > 0 && result.uniqueWords > 0;
}

/**
 * Test database operations
 */
export async function testDatabaseOperations(): Promise<boolean> {
  const { db } = await import("../storage/db");

  // Test write
  const end1 = perfMonitor.startTimer("DB_Write");
  await db.words.add({
    word: `test_word_${Date.now()}`,
    count: 1,
    lastSeen: new Date(),
    domains: ["test.com"],
    lemma: "test",
  });
  end1();

  // Test read
  const end2 = perfMonitor.startTimer("DB_Read");
  const words = await db.words.limit(10).toArray();
  end2();

  return words.length >= 0; // Should not throw
}

/**
 * Test translation cache
 */
export async function testTranslationCache(): Promise<boolean> {
  const { db } = await import("../storage/db");

  const testText = `hello_test_${Date.now()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Add to cache
  await db.translationCache.add({
    text: testText,
    result: {
      translation: "测试",
      phonetic: "test",
    },
    cachedAt: new Date(),
    expiresAt,
  });

  // Retrieve from cache
  const cached = await db.translationCache.get(testText);

  // Cleanup
  await db.translationCache.delete(testText);

  return cached !== undefined;
}

/**
 * Stress test: Process large text
 */
export async function stressTestLargeText(): Promise<boolean> {
  const { analyzeText } = await import("../core/textProcessor");

  // Generate 10,000 words
  const words = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur"];
  const largeText = Array(10000)
    .fill(0)
    .map(() => words[Math.floor(Math.random() * words.length)])
    .join(" ");

  const end = perfMonitor.startTimer("StressTest_LargeText");
  const result = analyzeText(largeText, "test.com");
  end();

  return result.totalWords > 9000; // Allow some filtering
}

/**
 * Stress test: Rapid database inserts
 */
export async function stressTestDatabaseInserts(): Promise<boolean> {
  const { db } = await import("../storage/db");
  const { batchProcess } = await import("./performance");

  const testWords = Array(100)
    .fill(0)
    .map((_, i) => ({
      word: `stress_test_${Date.now()}_${i}`,
      count: 1,
      lastSeen: new Date(),
      domains: ["test.com"],
      lemma: `test_${i}`,
    }));

  const end = perfMonitor.startTimer("StressTest_DB_Inserts");

  await batchProcess(
    testWords,
    async (word) => {
      await db.words.add(word);
    },
    10
  );

  end();

  // Cleanup
  await db.words.where("word").startsWith("stress_test_").delete();

  return true;
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  const tester = new ExtensionTester();

  console.log("\n=== Running Extension Tests ===\n");

  await tester.runTest("Text Extraction", testTextExtraction);
  await tester.runTest("Text Processing", testTextProcessing);
  await tester.runTest("Database Operations", testDatabaseOperations);
  await tester.runTest("Translation Cache", testTranslationCache);
  await tester.runTest("Stress Test: Large Text", stressTestLargeText);
  await tester.runTest("Stress Test: DB Inserts", stressTestDatabaseInserts);

  console.log("\n=== Performance Summary ===\n");
  perfMonitor.logSummary();

  console.log("\n");
  tester.printSummary();
}

/**
 * Generate test report
 */
export function generateTestReport(): string {
  const date = new Date().toISOString();
  const metrics = perfMonitor.getSummary();

  let report = "# Extension Test Report\n\n";
  report += `**Date**: ${date}\n\n`;
  report += `## Performance Metrics\n\n`;
  report += "| Operation | Count | Avg (ms) | Min (ms) | Max (ms) |\n";
  report += "|-----------|-------|----------|----------|----------|\n";

  for (const [name, stats] of Object.entries(metrics)) {
    report += `| ${name} | ${stats.count} | ${stats.avg} | ${stats.min} | ${stats.max} |\n`;
  }

  return report;
}

/**
 * Debug: Print extension state
 */
export async function debugExtensionState(): Promise<void> {
  console.log("\n=== Extension Debug Info ===\n");

  // Settings
  const settings = await chrome.storage.local.get("era_settings");
  console.log("Settings:", settings);

  // Database stats
  const { db } = await import("../storage/db");
  const wordCount = await db.words.count();
  const vocabCount = await db.vocabulary.count();
  const cacheCount = await db.translationCache.count();
  const statsCount = await db.readingStats.count();

  console.log("\nDatabase Stats:");
  console.log(`- Words: ${wordCount}`);
  console.log(`- Vocabulary: ${vocabCount}`);
  console.log(`- Cache Entries: ${cacheCount}`);
  console.log(`- Reading Stats: ${statsCount}`);

  // Performance
  console.log("\nPerformance:");
  perfMonitor.logSummary();

  // Memory
  const memory = (performance as any).memory;
  if (memory) {
    console.log("\nMemory Usage:");
    console.log(`- Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`- Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`- Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
  }
}

/**
 * Simulate user interaction for testing
 */
export async function simulateTextSelection(text: string): Promise<void> {
  const { sendMessage, MessageType } = await import("./messaging");

  await sendMessage({
    type: MessageType.TRANSLATE_TEXT,
    data: { text },
  });
}

/**
 * Benchmark a function
 */
export async function benchmark(
  name: string,
  fn: () => Promise<void> | void,
  iterations: number = 100
): Promise<void> {
  console.log(`\nBenchmarking: ${name} (${iterations} iterations)`);

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const duration = performance.now() - start;
    times.push(duration);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

  console.log(`Results:`);
  console.log(`- Average: ${avg.toFixed(2)}ms`);
  console.log(`- Median: ${median.toFixed(2)}ms`);
  console.log(`- Min: ${min.toFixed(2)}ms`);
  console.log(`- Max: ${max.toFixed(2)}ms`);
}

// Export for console access
if (typeof window !== "undefined") {
  (window as any).eraTest = {
    runAllTests,
    testTextExtraction,
    testTextProcessing,
    testDatabaseOperations,
    testTranslationCache,
    stressTestLargeText,
    stressTestDatabaseInserts,
    generateTestReport,
    debugExtensionState,
    benchmark,
    perfMonitor,
  };

  console.log("[ERA] Test utilities available via window.eraTest");
}
