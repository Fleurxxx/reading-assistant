// Message types for chrome.runtime messaging
export enum MessageType {
  // Content to Background
  EXTRACT_TEXT = "EXTRACT_TEXT",
  TRANSLATE_TEXT = "TRANSLATE_TEXT",
  SAVE_VOCABULARY = "SAVE_VOCABULARY",

  // Background to SidePanel
  TRANSLATION_RESULT = "TRANSLATION_RESULT",
  TRANSLATION_ERROR = "TRANSLATION_ERROR",

  // Settings
  UPDATE_SETTINGS = "UPDATE_SETTINGS",
  GET_SETTINGS = "GET_SETTINGS",

  // Panel and UI controls
  OPEN_SIDE_PANEL = "OPEN_SIDE_PANEL",
  GET_SELECTION = "GET_SELECTION",

  // Data updates
  BATCH_WORD_UPDATE = "BATCH_WORD_UPDATE",

  // Analysis controls
  REFRESH_ANALYSIS = "REFRESH_ANALYSIS",
  STOP_ANALYSIS = "STOP_ANALYSIS",
  START_ANALYSIS = "START_ANALYSIS",
}

export interface Message<T = any> {
  type: MessageType;
  data: T;
}

// Type-safe message sender
export function sendMessage<T = any>(message: Message<T>): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// Listen to messages with type safety
export function addMessageListener(
  callback: (message: Message, sender: chrome.runtime.MessageSender) => Promise<any> | any
) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Promise.resolve(callback(message, sender))
      .then(sendResponse)
      .catch((error) => {
        console.error("Message handler error:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  });
}
