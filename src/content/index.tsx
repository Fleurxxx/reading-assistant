import { analyzeText, estimateReadingTime } from "../core/textProcessor";
import type { Word } from "../storage/db";
import { db, getTodayDateString } from "../storage/db";
import { addMessageListener, MessageType, sendMessage } from "../utils/messaging";
import { perfMonitor } from "../utils/performance";
import { initSelectionHandler } from "./selectionHandler";
import {
  ContentObserver,
  extractMainContent,
  getPageMetadata,
  shouldAnalyzePage,
} from "./textExtractor";
import "./content.css";

/**
 * Content script main entry point
 */
class ContentScript {
  private observer: ContentObserver | null = null;
  private isInitialized: boolean = false;
  private lastAnalysisTime: number = 0;
  private analysisThrottleMs: number = 5000; // Throttle analysis to once per 5 seconds

  constructor() {
    this.init();
  }

  /**
   * Initialize content script
   */
  private async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log("[English Reading Assistant] Content script loaded");

    try {
      // Check if page should be analyzed
      const shouldAnalyze = await shouldAnalyzePage();

      if (!shouldAnalyze) {
        console.log("[English Reading Assistant] Page analysis disabled for this domain");
        // Still initialize selection handler for manual translation
        initSelectionHandler();
        this.isInitialized = true;
        return;
      }

      // Initialize selection handler
      initSelectionHandler();

      // Wait for page to be fully loaded
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          this.startAnalysis();
        });
      } else {
        this.startAnalysis();
      }

      // Setup message listeners
      this.setupMessageListeners();

      this.isInitialized = true;
    } catch (error) {
      console.error("[English Reading Assistant] Initialization error:", error);
    }
  }

  /**
   * Start text analysis
   */
  private async startAnalysis(): Promise<void> {
    try {
      // Initial analysis
      await this.analyzePageContent();

      // Setup observer for dynamic content
      this.observer = new ContentObserver(() => {
        this.analyzePageContent();
      });
      this.observer.start();

      console.log("[English Reading Assistant] Analysis started");
    } catch (error) {
      console.error("[English Reading Assistant] Analysis error:", error);
    }
  }

  /**
   * Analyze page content
   */
  private async analyzePageContent(): Promise<void> {
    // Throttle analysis
    const now = Date.now();
    if (now - this.lastAnalysisTime < this.analysisThrottleMs) {
      return;
    }
    this.lastAnalysisTime = now;

    const endTotal = perfMonitor.startTimer("ContentAnalysis_Total");

    try {
      // Extract text from page
      const endExtraction = perfMonitor.startTimer("ContentAnalysis_Extraction");
      const text = extractMainContent();
      endExtraction();

      if (!text || text.length < 50) {
        console.log("[English Reading Assistant] Insufficient content to analyze");
        endTotal();
        return;
      }

      // Get page metadata
      const metadata = getPageMetadata();

      // Analyze text
      const endAnalysis = perfMonitor.startTimer("ContentAnalysis_Processing");
      const analysis = analyzeText(text, metadata.domain);
      endAnalysis();

      console.log("[English Reading Assistant] Analysis complete:", {
        totalWords: analysis.totalWords,
        uniqueWords: analysis.uniqueWords,
        domain: metadata.domain,
      });

      // Store results in IndexedDB
      const endStorage = perfMonitor.startTimer("ContentAnalysis_Storage");
      await this.storeAnalysisResults(analysis, metadata.domain);
      endStorage();

      // Update daily statistics
      await this.updateDailyStats(analysis, metadata.domain);

      // Notify background script
      await sendMessage({
        type: MessageType.EXTRACT_TEXT,
        data: {
          totalWords: analysis.totalWords,
          uniqueWords: analysis.uniqueWords,
          domain: metadata.domain,
          url: metadata.url,
        },
      });
    } catch (error) {
      console.error("[English Reading Assistant] Content analysis error:", error);
    } finally {
      endTotal();
    }
  }

  /**
   * Store analysis results in database
   * Optimized with batch processing
   */
  private async storeAnalysisResults(
    analysis: ReturnType<typeof analyzeText>,
    domain: string
  ): Promise<void> {
    try {
      const wordsToStore: Word[] = [];
      const wordsToUpdate: Array<{ word: string; updates: Partial<Word> }> = [];
      const now = new Date();

      // Use transaction for better performance
      await db.transaction("rw", db.words, async () => {
        // Batch get existing words for efficiency
        const wordKeys = Array.from(analysis.wordFrequencies.keys());
        const batchSize = 50;

        for (let i = 0; i < wordKeys.length; i += batchSize) {
          const batch = wordKeys.slice(i, i + batchSize);
          const existing = await db.words.bulkGet(batch);

          for (let j = 0; j < batch.length; j++) {
            const word = batch[j];
            const freq = analysis.wordFrequencies.get(word)!;
            const existingWord = existing[j];

            if (existingWord) {
              // Update existing word
              wordsToUpdate.push({
                word,
                updates: {
                  count: existingWord.count + freq.count,
                  lastSeen: now,
                  domains: existingWord.domains.includes(domain)
                    ? existingWord.domains
                    : [...existingWord.domains, domain],
                },
              });
            } else {
              // Add new word
              wordsToStore.push({
                word: freq.lemma,
                count: freq.count,
                lastSeen: now,
                domains: [domain],
                lemma: freq.lemma,
              });
            }
          }
        }

        // Perform batch operations
        if (wordsToStore.length > 0) {
          await db.words.bulkAdd(wordsToStore);
        }

        if (wordsToUpdate.length > 0) {
          for (const { word, updates } of wordsToUpdate) {
            await db.words.update(word, updates);
          }
        }
      });

      console.log(
        `[English Reading Assistant] Stored ${wordsToStore.length} new words, updated ${wordsToUpdate.length}`
      );
    } catch (error) {
      console.error("[English Reading Assistant] Error storing analysis results:", error);
    }
  }

  /**
   * Update daily statistics
   */
  private async updateDailyStats(
    analysis: ReturnType<typeof analyzeText>,
    domain: string
  ): Promise<void> {
    try {
      const today = getTodayDateString();
      const existing = await db.readingStats.get(today);

      const readingTime = estimateReadingTime(analysis.totalWords);

      if (existing) {
        // Update existing stats
        await db.readingStats.update(today, {
          wordsCount: existing.wordsCount + analysis.totalWords,
          uniqueWords: existing.uniqueWords + analysis.uniqueWords,
          domainsVisited: existing.domainsVisited.includes(domain)
            ? existing.domainsVisited
            : [...existing.domainsVisited, domain],
          readingTime: existing.readingTime + readingTime,
        });
      } else {
        // Create new stats entry
        await db.readingStats.add({
          date: today,
          wordsCount: analysis.totalWords,
          uniqueWords: analysis.uniqueWords,
          domainsVisited: [domain],
          translationCount: 0,
          readingTime,
        });
      }
    } catch (error) {
      console.error("[English Reading Assistant] Error updating daily stats:", error);
    }
  }

  /**
   * Setup message listeners
   */
  private setupMessageListeners(): void {
    addMessageListener(async (message, _sender) => {
      switch (message.type) {
        case MessageType.REFRESH_ANALYSIS:
          await this.analyzePageContent();
          return { success: true };

        case MessageType.STOP_ANALYSIS:
          if (this.observer) {
            this.observer.stop();
          }
          return { success: true };

        case MessageType.START_ANALYSIS:
          await this.startAnalysis();
          return { success: true };

        default:
          return { success: false, error: "Unknown message type" };
      }
    });
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.stop();
      this.observer = null;
    }
    this.isInitialized = false;
  }
}

// Initialize content script
const contentScript = new ContentScript();

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  contentScript.destroy();
});

// Export for testing
export default contentScript;
