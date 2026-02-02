/**
 * Example usage of the translation service
 * This file demonstrates how to integrate the translation service
 * into different parts of the Chrome extension
 */

import { addMessageListener, MessageType, sendMessage } from "../utils/messaging";
import { TranslationError, TranslationErrorCode, translationService } from "./index";

/**
 * Example 1: Background Service Worker Integration
 *
 * This shows how to handle translation requests in the background service worker
 */
export function setupBackgroundTranslationHandler(): void {
  addMessageListener(async (message, sender) => {
    if (message.type === MessageType.TRANSLATE_TEXT) {
      const { text, from = "en", to = "zh-CHS" } = message.data;

      try {
        // Translate with caching
        const result = await translationService.translate(text, from, to);

        // Send result to side panel or popup
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: MessageType.TRANSLATION_RESULT,
            data: result,
          });
        }

        return { success: true, data: result };
      } catch (error) {
        let errorMessage = "Translation failed";
        let errorCode: string = TranslationErrorCode.UNKNOWN_ERROR;

        if (error instanceof TranslationError) {
          errorMessage = error.message;
          errorCode = error.code;

          // Special handling for missing credentials
          if (errorCode === TranslationErrorCode.NO_CREDENTIALS) {
            // Open options page to configure credentials
            chrome.runtime.openOptionsPage();
          }
        }

        // Send error to requesting context
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: MessageType.TRANSLATION_ERROR,
            data: { code: errorCode, message: errorMessage },
          });
        }

        return { success: false, error: errorMessage, code: errorCode };
      }
    }
  });

  // Clean expired cache entries daily
  chrome.alarms.create("cleanTranslationCache", {
    periodInMinutes: 1440, // Once per day
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "cleanTranslationCache") {
      const cleaned = await translationService.cleanExpiredCache();
      console.log(`Cleaned ${cleaned} expired translation cache entries`);
    }
  });
}

/**
 * Example 2: Content Script Integration
 *
 * Handle user text selection and request translation
 */
export function setupContentScriptTranslation(): void {
  // Listen for text selection
  document.addEventListener("mouseup", async () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && selectedText.length < 500) {
      try {
        // Send translation request to background
        const response = await sendMessage({
          type: MessageType.TRANSLATE_TEXT,
          data: { text: selectedText },
        });

        if (response.success) {
          // Translation will be displayed in side panel
          console.log("Translation requested:", selectedText);
        }
      } catch (error) {
        console.error("Failed to request translation:", error);
      }
    }
  });
}

/**
 * Example 3: Side Panel UI Integration (React component)
 *
 * Display translation results in the side panel
 */
export function TranslationPanelExample() {
  // This is a conceptual example for React components
  // Actual implementation would use React hooks
  /*
  import { useState, useEffect } from 'react';
  import { addMessageListener } from '@/utils/messaging';
  import { TranslationResult } from '@/storage/db';

  function TranslationPanel() {
    const [translation, setTranslation] = useState<TranslationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      // Listen for translation results
      addMessageListener((message) => {
        if (message.type === MessageType.TRANSLATION_RESULT) {
          setTranslation(message.data);
          setLoading(false);
          setError(null);
        } else if (message.type === MessageType.TRANSLATION_ERROR) {
          setError(message.data.message);
          setLoading(false);
        }
      });
    }, []);

    if (loading) {
      return <div>Translating...</div>;
    }

    if (error) {
      return (
        <div className="error">
          <p>Translation Error: {error}</p>
          {error.includes('credentials') && (
            <button onClick={() => chrome.runtime.openOptionsPage()}>
              Configure API
            </button>
          )}
        </div>
      );
    }

    if (!translation) {
      return <div>Select text to translate</div>;
    }

    return (
      <div className="translation-result">
        <div className="translation">{translation.translation}</div>
        {translation.phonetic && (
          <div className="phonetic">[{translation.phonetic}]</div>
        )}
        {translation.explains && (
          <ul className="explains">
            {translation.explains.map((explain, i) => (
              <li key={i}>{explain}</li>
            ))}
          </ul>
        )}
        {translation.examples && (
          <div className="examples">
            <h4>Examples:</h4>
            {translation.examples.map((example, i) => (
              <p key={i}>{example}</p>
            ))}
          </div>
        )}
      </div>
    );
  }
  */
}

/**
 * Example 4: Options Page - API Configuration
 *
 * Allow users to configure Youdao API credentials
 */
export function setupOptionsPageConfiguration() {
  /*
  import { useState } from 'react';
  import { youdaoTranslator } from '@/services';

  function SettingsForm() {
    const [appKey, setAppKey] = useState('');
    const [appSecret, setAppSecret] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = async () => {
      if (!appKey || !appSecret) {
        setMessage('Please enter both App Key and App Secret');
        return;
      }

      setSaving(true);
      try {
        await youdaoTranslator.setCredentials(appKey, appSecret);
        
        // Test the credentials
        const isConfigured = await youdaoTranslator.isConfigured();
        if (isConfigured) {
          setMessage('✅ Credentials saved successfully!');
        }
      } catch (error) {
        setMessage('❌ Failed to save credentials');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="settings-form">
        <h2>Youdao API Configuration</h2>
        <div className="form-group">
          <label>App Key:</label>
          <input
            type="text"
            value={appKey}
            onChange={(e) => setAppKey(e.target.value)}
            placeholder="Enter your Youdao App Key"
          />
        </div>
        <div className="form-group">
          <label>App Secret:</label>
          <input
            type="password"
            value={appSecret}
            onChange={(e) => setAppSecret(e.target.value)}
            placeholder="Enter your Youdao App Secret"
          />
        </div>
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Credentials'}
        </button>
        {message && <p className="message">{message}</p>}
        <div className="help">
          <p>
            Don't have API credentials?{' '}
            <a href="https://ai.youdao.com/" target="_blank" rel="noopener noreferrer">
              Get them here
            </a>
          </p>
        </div>
      </div>
    );
  }
  */
}

/**
 * Example 5: Popup Stats Display
 *
 * Show translation statistics in the extension popup
 */
export async function displayTranslationStats(): Promise<void> {
  const stats = await translationService.getCacheStats();

  console.log("Translation Statistics:");
  console.log(`- Total cached translations: ${stats.totalEntries}`);
  console.log(`- Cache hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`- Memory cache size: ${stats.memoryCacheSize}`);

  /*
  // In a React component:
  function StatsView() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
      translationService.getCacheStats().then(setStats);
    }, []);

    if (!stats) return <div>Loading...</div>;

    return (
      <div className="stats">
        <div className="stat-item">
          <span className="label">Cached Translations:</span>
          <span className="value">{stats.totalEntries}</span>
        </div>
        <div className="stat-item">
          <span className="label">Cache Hit Rate:</span>
          <span className="value">{(stats.hitRate * 100).toFixed(2)}%</span>
        </div>
        <div className="stat-item">
          <span className="label">Memory Cache:</span>
          <span className="value">{stats.memoryCacheSize} items</span>
        </div>
      </div>
    );
  }
  */
}

/**
 * Example 6: Vocabulary Integration
 *
 * Save translated word to vocabulary collection
 */
export async function saveToVocabulary(_word: string, _translation: string): Promise<void> {
  /*
  import { db } from '@/storage/db';

  async function addToVocabulary(word: string) {
    // Get translation
    const result = await translationService.translate(word);
    
    // Save to vocabulary
    await db.vocabulary.add({
      word,
      translation: result.translation,
      examples: result.examples || [],
      addedAt: new Date(),
      mastered: false,
      tags: [],
      pronunciation: result.phonetic,
    });
    
    console.log(`Added "${word}" to vocabulary`);
  }
  */
}

/**
 * Example 7: Batch Translation for Word List
 *
 * Translate multiple words efficiently
 */
export async function translateWordList(words: string[]): Promise<void> {
  console.log(`Translating ${words.length} words...`);

  const startTime = Date.now();
  const results = await translationService.translateBatch(words);
  const endTime = Date.now();

  console.log(`Completed in ${endTime - startTime}ms`);

  // Display results
  results.forEach((result, index) => {
    console.log(`${words[index]} → ${result.translation}`);
  });

  // Get cache stats
  const stats = await translationService.getCacheStats();
  console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
}

/**
 * Example 8: Error Handling with User Feedback
 */
export async function translateWithUserFeedback(text: string): Promise<void> {
  try {
    const result = await translationService.translate(text);

    // Show success notification
    showNotification("Translation successful", "success");
    displayTranslation(result);
  } catch (error) {
    if (error instanceof TranslationError) {
      switch (error.code) {
        case TranslationErrorCode.NO_CREDENTIALS:
          showNotification("Please configure Youdao API credentials in settings", "warning", () =>
            chrome.runtime.openOptionsPage()
          );
          break;

        case TranslationErrorCode.RATE_LIMIT:
          showNotification("Translation rate limit reached. Please try again later.", "error");
          break;

        case TranslationErrorCode.NETWORK_ERROR:
          showNotification("Network error. Please check your connection.", "error");
          break;

        case TranslationErrorCode.TEXT_TOO_LONG:
          showNotification("Selected text is too long. Please select less text.", "warning");
          break;

        default:
          showNotification(`Translation error: ${error.message}`, "error");
      }
    } else {
      showNotification("Unexpected error occurred", "error");
    }
  }
}

// Helper functions (placeholders)
function showNotification(message: string, type: string, action?: () => void): void {
  console.log(`[${type.toUpperCase()}] ${message}`);
  if (action) action();
}

function displayTranslation(result: any): void {
  console.log("Translation:", result);
}

/**
 * Example 9: Initialize translation service on extension install
 */
export async function initializeTranslationService(): Promise<void> {
  console.log("Initializing translation service...");

  // Check if configured
  const isConfigured = await translationService.isConfigured();
  if (!isConfigured) {
    console.warn("Youdao API not configured. Opening options page...");
    chrome.runtime.openOptionsPage();
    return;
  }

  // Clean expired cache
  const cleaned = await translationService.cleanExpiredCache();
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} expired cache entries`);
  }

  // Get cache stats
  const stats = await translationService.getCacheStats();
  console.log("Translation service ready!");
  console.log(`- Cached translations: ${stats.totalEntries}`);
  console.log(`- Service: ${translationService.getAdapterName()}`);
}
