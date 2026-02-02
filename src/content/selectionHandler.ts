import { MessageType, sendMessage } from "../utils/messaging";
import { getSelectedText } from "./textExtractor";

/**
 * Selection handler for text translation
 */
export class SelectionHandler {
  private isEnabled: boolean = true;
  private minSelectionLength: number = 1;
  private maxSelectionLength: number = 500;

  constructor() {
    this.setupListeners();
  }

  /**
   * Setup event listeners for text selection
   */
  private setupListeners(): void {
    // Mouse selection
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // Keyboard selection
    document.addEventListener("keyup", this.handleKeyUp.bind(this));

    // Context menu (handled by background script)
    // Keyboard shortcut (handled by background script via commands API)
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(event: MouseEvent): void {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      this.handleSelection(event);
    }, 10);
  }

  /**
   * Handle keyboard up event (for keyboard selection)
   */
  private handleKeyUp(event: KeyboardEvent): void {
    // Only trigger on arrow keys, shift, or other selection keys
    const selectionKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Shift"];
    if (selectionKeys.includes(event.key)) {
      setTimeout(() => {
        this.handleSelection(event);
      }, 10);
    }
  }

  /**
   * Handle text selection
   */
  private async handleSelection(event: MouseEvent | KeyboardEvent): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const selectedText = getSelectedText();

    // Validate selection
    if (!this.isValidSelection(selectedText)) {
      return;
    }

    // Check if user clicked on an input/textarea
    const target = event.target as HTMLElement;
    if (this.isInputElement(target)) {
      return;
    }

    // Send translation request to background
    try {
      await sendMessage({
        type: MessageType.TRANSLATE_TEXT,
        data: {
          text: selectedText,
          context: this.getSelectionContext(selectedText),
        },
      });

      // Open side panel
      await this.openSidePanel();
    } catch (error) {
      console.error("Error sending translation request:", error);
    }
  }

  /**
   * Validate if selection should trigger translation
   */
  private isValidSelection(text: string): boolean {
    if (!text) return false;

    const length = text.length;
    if (length < this.minSelectionLength || length > this.maxSelectionLength) {
      return false;
    }

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(text)) {
      return false;
    }

    return true;
  }

  /**
   * Check if target is an input element
   */
  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === "input" || tagName === "textarea" || element.isContentEditable;
  }

  /**
   * Get context around the selection
   */
  private getSelectionContext(selectedText: string): string {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return "";
    }

    try {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;

      // Get parent element text
      const parentElement =
        container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as Element);

      if (parentElement) {
        const fullText = parentElement.textContent || "";
        const selectedIndex = fullText.indexOf(selectedText);

        if (selectedIndex !== -1) {
          // Get 50 characters before and after
          const start = Math.max(0, selectedIndex - 50);
          const end = Math.min(fullText.length, selectedIndex + selectedText.length + 50);
          return fullText.substring(start, end);
        }
      }
    } catch (error) {
      console.error("Error getting selection context:", error);
    }

    return selectedText;
  }

  /**
   * Open side panel
   */
  private async openSidePanel(): Promise<void> {
    try {
      // Use chrome.runtime.sendMessage to request side panel opening
      await chrome.runtime.sendMessage({
        type: "OPEN_SIDE_PANEL",
      });
    } catch (error) {
      console.error("Error opening side panel:", error);
    }
  }

  /**
   * Enable selection handler
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable selection handler
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Set minimum selection length
   */
  setMinLength(length: number): void {
    this.minSelectionLength = length;
  }

  /**
   * Set maximum selection length
   */
  setMaxLength(length: number): void {
    this.maxSelectionLength = length;
  }
}

/**
 * Create and export singleton instance
 */
let selectionHandlerInstance: SelectionHandler | null = null;

export function initSelectionHandler(): SelectionHandler {
  if (!selectionHandlerInstance) {
    selectionHandlerInstance = new SelectionHandler();
  }
  return selectionHandlerInstance;
}

export function getSelectionHandler(): SelectionHandler | null {
  return selectionHandlerInstance;
}
