import { TEXT_EXTRACTION_DEBOUNCE_MS } from "../utils/constants";

/**
 * Elements to exclude from text extraction
 */
const EXCLUDED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "SVG",
  "CANVAS",
  "VIDEO",
  "AUDIO",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "BUTTON",
  "NAV",
  "HEADER",
  "FOOTER",
  "ASIDE",
]);

/**
 * Elements that typically contain code
 */
const CODE_TAGS = new Set(["PRE", "CODE", "KBD", "SAMP", "VAR"]);

/**
 * Check if an element should be excluded from text extraction
 */
function shouldExcludeElement(element: Element): boolean {
  // Check tag name
  if (EXCLUDED_TAGS.has(element.tagName)) {
    return true;
  }

  // Check if element is hidden
  if (element instanceof HTMLElement) {
    const style = window.getComputedStyle(element);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0" ||
      parseFloat(style.fontSize) === 0
    ) {
      return true;
    }
  }

  // Check for code blocks (configurable - user might want to analyze code comments)
  if (CODE_TAGS.has(element.tagName)) {
    return true;
  }

  // Check for aria-hidden
  if (element.getAttribute("aria-hidden") === "true") {
    return true;
  }

  // Check for data attributes that indicate non-content
  if (element.hasAttribute("data-nosnippet")) {
    return true;
  }

  return false;
}

/**
 * Extract text content from an element and its children
 */
function extractTextFromElement(element: Element): string {
  if (shouldExcludeElement(element)) {
    return "";
  }

  let text = "";

  // Process child nodes
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Text node - add its content
      const textContent = node.textContent?.trim() || "";
      if (textContent) {
        text += `${textContent} `;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Element node - recurse
      const childText = extractTextFromElement(node as Element);
      if (childText) {
        text += `${childText} `;
      }
    }
  }

  return text;
}

/**
 * Extract all visible text from the page
 */
export function extractPageText(): string {
  // Start from body or documentElement
  const root = document.body || document.documentElement;

  if (!root) {
    return "";
  }

  // Extract text from main content areas
  const text = extractTextFromElement(root);

  return text.trim();
}

/**
 * Extract text from specific elements (e.g., article content)
 * Prioritizes main content areas
 */
export function extractMainContent(): string {
  // Try to find main content containers
  const selectors = [
    "main",
    "article",
    '[role="main"]',
    ".content",
    ".article",
    ".post",
    "#content",
    "#main",
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && !shouldExcludeElement(element)) {
      const text = extractTextFromElement(element);
      if (text.length > 100) {
        // Minimum content threshold
        return text;
      }
    }
  }

  // Fallback to full page extraction
  return extractPageText();
}

/**
 * Get current domain
 */
export function getCurrentDomain(): string {
  return window.location.hostname;
}

/**
 * Get page metadata
 */
export interface PageMetadata {
  title: string;
  url: string;
  domain: string;
  language: string;
}

export function getPageMetadata(): PageMetadata {
  return {
    title: document.title,
    url: window.location.href,
    domain: getCurrentDomain(),
    language: document.documentElement.lang || "en",
  };
}

/**
 * Debounce helper for text extraction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * MutationObserver wrapper for SPA content changes
 */
export class ContentObserver {
  private observer: MutationObserver | null = null;
  private debounced: () => void;

  constructor(callback: () => void, debounceMs: number = TEXT_EXTRACTION_DEBOUNCE_MS) {
    this.debounced = debounce(callback, debounceMs);
  }

  start(): void {
    if (this.observer) {
      return; // Already observing
    }

    this.observer = new MutationObserver((mutations) => {
      // Check if mutations contain significant text changes
      const hasTextChange = mutations.some((mutation) => {
        // Check added nodes
        if (mutation.addedNodes.length > 0) {
          return Array.from(mutation.addedNodes).some((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              return (node.textContent?.trim().length || 0) > 10;
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              return !shouldExcludeElement(element);
            }
            return false;
          });
        }

        // Check character data changes
        if (mutation.type === "characterData") {
          return (mutation.target.textContent?.trim().length || 0) > 10;
        }

        return false;
      });

      if (hasTextChange) {
        this.debounced();
      }
    });

    // Observe document body for changes
    const target = document.body || document.documentElement;
    this.observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: false,
    });
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/**
 * Extract text from a selection
 */
export function getSelectedText(): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return "";
  }

  return selection.toString().trim();
}

/**
 * Check if current page should be analyzed based on settings
 */
export async function shouldAnalyzePage(): Promise<boolean> {
  try {
    // Get settings from storage
    const result = await chrome.storage.local.get("era_settings");
    const settings = result.era_settings;

    if (!settings || !settings.autoAnalysis) {
      return false;
    }

    const domain = getCurrentDomain();

    // Check blacklist
    if (settings.blacklistDomains && Array.isArray(settings.blacklistDomains)) {
      for (const pattern of settings.blacklistDomains) {
        if (domain.includes(pattern)) {
          return false;
        }
      }
    }

    // Check whitelist (if not empty, only whitelist domains are analyzed)
    if (
      settings.whitelistDomains &&
      Array.isArray(settings.whitelistDomains) &&
      settings.whitelistDomains.length > 0
    ) {
      return settings.whitelistDomains.some((pattern: string) => domain.includes(pattern));
    }

    return true;
  } catch (error) {
    console.error("Error checking page analysis settings:", error);
    return true; // Default to analyzing
  }
}
