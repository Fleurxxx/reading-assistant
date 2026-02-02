import { translateText } from "../services/translationService";
import { db, getTodayDateString } from "../storage/db";
import { MessageType } from "../utils/messaging";

/**
 * Message handler for background service worker
 * Processes all incoming messages from content scripts and other parts of the extension
 */
export class MessageHandler {
  /**
   * Handle translation request
   */
  async handleTranslation(
    data: { text: string; context?: string },
    _sender: chrome.runtime.MessageSender
  ): Promise<any> {
    try {
      console.log("[MessageHandler] Translation request:", data.text);

      // Validate input
      if (!data.text || data.text.length === 0) {
        throw new Error("Empty text provided");
      }

      if (data.text.length > 5000) {
        throw new Error("Text too long (max 5000 characters)");
      }

      // Translate text
      const result = await translateText(data.text);

      // Update translation count in daily stats
      await this.incrementTranslationCount();

      // Send result to side panel
      await this.sendToSidePanel({
        type: MessageType.TRANSLATION_RESULT,
        data: {
          text: data.text,
          result,
          context: data.context,
        },
      });

      return { success: true, result };
    } catch (error: any) {
      console.error("[MessageHandler] Translation error:", error);

      // Send error to side panel
      await this.sendToSidePanel({
        type: MessageType.TRANSLATION_ERROR,
        data: {
          text: data.text,
          error: error.message || "Translation failed",
        },
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Handle text extraction notification from content script
   */
  async handleTextExtraction(data: {
    totalWords: number;
    uniqueWords: number;
    domain: string;
    url: string;
  }): Promise<any> {
    try {
      console.log("[MessageHandler] Text extraction:", data);

      // Update reading stats
      const today = getTodayDateString();
      const existing = await db.readingStats.get(today);

      if (existing) {
        // Update existing stats
        const domainsSet = new Set(existing.domainsVisited);
        domainsSet.add(data.domain);

        await db.readingStats.update(today, {
          wordsCount: existing.wordsCount + data.totalWords,
          uniqueWords: Math.max(existing.uniqueWords, data.uniqueWords),
          domainsVisited: Array.from(domainsSet),
        });
      } else {
        // Create new stats entry
        await db.readingStats.add({
          date: today,
          wordsCount: data.totalWords,
          uniqueWords: data.uniqueWords,
          domainsVisited: [data.domain],
          translationCount: 0,
          readingTime: 0,
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error("[MessageHandler] Text extraction error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle save vocabulary request
   */
  async handleSaveVocabulary(data: {
    word: string;
    translation: string;
    examples?: string[];
    pronunciation?: string;
  }): Promise<any> {
    try {
      console.log("[MessageHandler] Save vocabulary:", data.word);

      // Validate input
      if (!data.word || !data.translation) {
        throw new Error("Word and translation are required");
      }

      const normalizedWord = data.word.toLowerCase().trim();

      // Check if word already exists
      const existing = await db.vocabulary.where("word").equals(normalizedWord).first();

      if (existing) {
        return {
          success: false,
          error: "Word already in vocabulary",
          duplicate: true,
        };
      }

      // Add to vocabulary
      const id = await db.vocabulary.add({
        word: normalizedWord,
        translation: data.translation,
        examples: data.examples || [],
        pronunciation: data.pronunciation,
        addedAt: new Date(),
        mastered: false,
        tags: [],
      });

      return { success: true, id };
    } catch (error: any) {
      console.error("[MessageHandler] Save vocabulary error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle get settings request
   */
  async handleGetSettings(): Promise<any> {
    try {
      const result = await chrome.storage.local.get(["era_settings", "era_api_credentials"]);

      return {
        success: true,
        settings: result.era_settings,
        credentials: result.era_api_credentials,
      };
    } catch (error: any) {
      console.error("[MessageHandler] Get settings error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle update settings request
   */
  async handleUpdateSettings(settings: any): Promise<any> {
    try {
      await chrome.storage.local.set({ era_settings: settings });

      // Broadcast settings update to all tabs
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: "SETTINGS_UPDATED",
              data: settings,
            });
          } catch (_error) {
            // Tab may not have content script injected
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("[MessageHandler] Update settings error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle open side panel request
   */
  async handleOpenSidePanel(sender: chrome.runtime.MessageSender): Promise<any> {
    try {
      if (sender.tab?.id) {
        await chrome.sidePanel.open({ tabId: sender.tab.id });
      } else if (sender.tab?.windowId) {
        await chrome.sidePanel.open({ windowId: sender.tab.windowId });
      } else {
        // Fallback: open in current window
        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (currentTab?.windowId) {
          await chrome.sidePanel.open({ windowId: currentTab.windowId });
        }
      }
      return { success: true };
    } catch (error: any) {
      console.error("[MessageHandler] Open side panel error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle get selection request (from keyboard shortcut)
   */
  async handleGetSelection(sender: chrome.runtime.MessageSender): Promise<any> {
    try {
      if (!sender.tab?.id) {
        return { success: false, error: "No active tab" };
      }

      // Send message to content script to get current selection
      const response = await chrome.tabs.sendMessage(sender.tab.id, {
        type: "GET_SELECTION",
      });

      if (response?.text) {
        // Process the selection as a translation request
        return await this.handleTranslation(
          { text: response.text, context: response.context },
          sender
        );
      }

      return { success: false, error: "No text selected" };
    } catch (error: any) {
      console.error("[MessageHandler] Get selection error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle batch word updates
   */
  async handleBatchWordUpdate(
    words: Array<{ word: string; count: number; domain: string }>
  ): Promise<any> {
    try {
      console.log("[MessageHandler] Batch word update:", words.length, "words");

      // Process words in batches to avoid blocking
      const batchSize = 50;
      let processed = 0;

      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async ({ word, count, domain }) => {
            const existing = await db.words.get(word);

            if (existing) {
              // Update existing word
              const domainsSet = new Set(existing.domains);
              domainsSet.add(domain);

              await db.words.update(word, {
                count: existing.count + count,
                lastSeen: new Date(),
                domains: Array.from(domainsSet),
              });
            } else {
              // Add new word
              await db.words.add({
                word,
                count,
                lastSeen: new Date(),
                domains: [domain],
                lemma: word, // Will be updated by lemmatizer later if needed
              });
            }
          })
        );

        processed += batch.length;
      }

      return { success: true, processed };
    } catch (error: any) {
      console.error("[MessageHandler] Batch word update error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send message to side panel
   */
  private async sendToSidePanel(message: any): Promise<void> {
    try {
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      // Side panel might not be open, that's okay
      console.debug("[MessageHandler] Side panel not available:", error);
    }
  }

  /**
   * Increment translation count in daily stats
   */
  private async incrementTranslationCount(): Promise<void> {
    try {
      const today = getTodayDateString();
      const existing = await db.readingStats.get(today);

      if (existing) {
        await db.readingStats.update(today, {
          translationCount: existing.translationCount + 1,
        });
      } else {
        await db.readingStats.add({
          date: today,
          wordsCount: 0,
          uniqueWords: 0,
          domainsVisited: [],
          translationCount: 1,
          readingTime: 0,
        });
      }
    } catch (error) {
      console.error("[MessageHandler] Error incrementing translation count:", error);
    }
  }
}

// Export singleton instance
export const messageHandler = new MessageHandler();
