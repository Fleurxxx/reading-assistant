import { addMessageListener, MessageType } from "../utils/messaging";
import { alarmHandler } from "./alarmHandler";
import { messageHandler } from "./messageHandler";

/**
 * Background service worker
 * Coordinates extension operations and handles messages
 */
class BackgroundService {
  constructor() {
    this.init();
  }

  /**
   * Initialize background service
   */
  private init(): void {
    console.log("[English Reading Assistant] Background service initialized");

    // Setup message listeners
    this.setupMessageListeners();

    // Setup context menu
    this.setupContextMenu();

    // Setup alarms for daily stats reset
    alarmHandler.setupAlarms();

    // Setup command listeners
    this.setupCommands();

    // Setup installation and update handlers
    this.setupInstallationHandlers();
  }

  /**
   * Setup message listeners
   */
  private setupMessageListeners(): void {
    addMessageListener(async (message, sender) => {
      switch (message.type) {
        case MessageType.TRANSLATE_TEXT:
          return await messageHandler.handleTranslation(message.data, sender);

        case MessageType.EXTRACT_TEXT:
          return await messageHandler.handleTextExtraction(message.data);

        case MessageType.SAVE_VOCABULARY:
          return await messageHandler.handleSaveVocabulary(message.data);

        case MessageType.GET_SETTINGS:
          return await messageHandler.handleGetSettings();

        case MessageType.UPDATE_SETTINGS:
          return await messageHandler.handleUpdateSettings(message.data);

        case MessageType.OPEN_SIDE_PANEL:
          return await messageHandler.handleOpenSidePanel(sender);

        case MessageType.GET_SELECTION:
          return await messageHandler.handleGetSelection(sender);

        case MessageType.BATCH_WORD_UPDATE:
          return await messageHandler.handleBatchWordUpdate(message.data);

        default:
          console.warn("[Background] Unknown message type:", message.type);
          return { success: false, error: "Unknown message type" };
      }
    });
  }

  /**
   * Setup context menu
   */
  private setupContextMenu(): void {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === "translate-selection" && info.selectionText && tab?.id) {
        try {
          // Send translation request through message handler
          const sender = { tab };
          await messageHandler.handleTranslation(
            { text: info.selectionText },
            sender as chrome.runtime.MessageSender
          );

          // Open side panel
          await chrome.sidePanel.open({ tabId: tab.id });
        } catch (error) {
          console.error("[Background] Context menu translation error:", error);
        }
      }
    });
  }

  /**
   * Setup installation and update handlers
   */
  private setupInstallationHandlers(): void {
    chrome.runtime.onInstalled.addListener(async (details) => {
      console.log("[Background] Extension installed/updated:", details.reason);

      // Create context menu
      try {
        await chrome.contextMenus.create({
          id: "translate-selection",
          title: 'Translate "%s"',
          contexts: ["selection"],
        });
        console.log("[Background] Context menu created");
      } catch (error) {
        console.error("[Background] Error creating context menu:", error);
      }

      // Handle different installation reasons
      if (details.reason === "install") {
        await this.handleFirstInstall();
      } else if (details.reason === "update") {
        await this.handleUpdate(details.previousVersion);
      }
    });
  }

  /**
   * Handle first installation
   */
  private async handleFirstInstall(): Promise<void> {
    console.log("[Background] First installation detected");

    try {
      // Set default settings if not present
      const { era_settings } = await chrome.storage.local.get("era_settings");

      if (!era_settings) {
        // Define default settings inline to avoid module loading issues in service worker
        const DEFAULT_SETTINGS = {
          autoAnalysis: true,
          blacklistDomains: [],
          whitelistDomains: [],
          sidePanelPosition: "right" as const,
          theme: "auto" as const,
          fontSize: 14,
          enableShortcuts: true,
        };
        await chrome.storage.local.set({ era_settings: DEFAULT_SETTINGS });
        console.log("[Background] Default settings initialized");
      }

      // Show welcome notification
      try {
        await chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon128.svg"),
          title: "Welcome to English Reading Assistant!",
          message: "Select any text to translate. Configure API keys in settings.",
          priority: 2,
        });
      } catch (error) {
        console.debug("[Background] Could not show welcome notification:", error);
      }

      // Open options page on first install
      chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error("[Background] Error during first install:", error);
    }
  }

  /**
   * Handle extension update
   */
  private async handleUpdate(previousVersion?: string): Promise<void> {
    console.log("[Background] Extension updated from version:", previousVersion);

    // Perform any migration tasks here if needed
    // For example, updating database schema, settings format, etc.
  }

  /**
   * Setup keyboard commands
   */
  private setupCommands(): void {
    chrome.commands.onCommand.addListener(async (command) => {
      if (command === "translate-selection") {
        try {
          // Get active tab
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

          if (!tab?.id) {
            console.warn("[Background] No active tab for command");
            return;
          }

          // Send message to content script to get and translate selection
          await chrome.tabs.sendMessage(tab.id, {
            type: "TRANSLATE_CURRENT_SELECTION",
          });

          // Open side panel
          await chrome.sidePanel.open({ tabId: tab.id });
        } catch (error) {
          console.error("[Background] Command error:", error);
        }
      }
    });
  }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Export for testing
export default BackgroundService;
export { backgroundService };
