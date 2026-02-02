# Content Script - Text Extraction & Word Analysis

This directory contains the content script implementation for the English Reading Assistant extension. The content script runs on every webpage and handles text extraction, word frequency analysis, and text selection for translation.

## Architecture

```
content/
├── index.tsx              # Main entry point and orchestration
├── textExtractor.ts       # Page text extraction logic
├── selectionHandler.ts    # Text selection and translation trigger
└── content.css           # Minimal styles for UI elements
```

## Core Components

### 1. Text Extractor (`textExtractor.ts`)

Extracts visible text content from web pages with intelligent filtering:

**Features:**
- Excludes non-content elements (scripts, styles, navigation, etc.)
- Filters out hidden elements (display: none, visibility: hidden)
- Ignores code blocks (configurable)
- Prioritizes main content areas (article, main tags)
- Handles dynamic content with MutationObserver

**Key Functions:**
- `extractPageText()` - Extract all visible text from page
- `extractMainContent()` - Smart extraction focusing on main content
- `ContentObserver` - Monitor DOM changes for SPAs
- `shouldAnalyzePage()` - Check domain whitelist/blacklist

**Performance:**
- Debounced extraction (200ms default)
- Throttled analysis (5 seconds between runs)
- Efficient DOM traversal
- Viewport-aware extraction

### 2. Selection Handler (`selectionHandler.ts`)

Handles text selection events and triggers translation:

**Features:**
- Mouse selection detection
- Keyboard selection support
- Context menu integration
- Automatic side panel opening
- Selection validation (length, content type)

**Key Functions:**
- `handleSelection()` - Process text selection
- `getSelectionContext()` - Extract surrounding context
- `openSidePanel()` - Open translation panel

**Configuration:**
- Min selection length: 1 character
- Max selection length: 500 characters
- Excludes input fields and editable elements

### 3. Main Content Script (`index.tsx`)

Orchestrates all content script functionality:

**Responsibilities:**
- Initialize text extraction and analysis
- Coordinate with background script
- Store analysis results in IndexedDB
- Update daily statistics
- Handle settings and preferences

**Workflow:**
1. Check if page should be analyzed (domain whitelist/blacklist)
2. Extract text content from page
3. Analyze text using `textProcessor`
4. Store word frequencies in database
5. Update daily reading statistics
6. Monitor DOM for dynamic content changes

## Data Flow

```
Page Load
    ↓
Check Settings (shouldAnalyzePage)
    ↓
Extract Text (extractMainContent)
    ↓
Analyze Text (analyzeText)
    ↓
Store Results (IndexedDB)
    ↓
Update Stats (readingStats)
    ↓
Monitor Changes (ContentObserver)
```

## Text Selection Flow

```
User Selects Text
    ↓
SelectionHandler.handleSelection()
    ↓
Validate Selection
    ↓
Send to Background (TRANSLATE_TEXT)
    ↓
Open Side Panel
    ↓
Display Translation
```

## Integration with Core Modules

### Text Processing Pipeline

```typescript
extractMainContent()  // Get raw text
    ↓
cleanText()          // Normalize whitespace, punctuation
    ↓
tokenize()           // Split into words
    ↓
shouldCountWord()    // Filter stop words
    ↓
lemmatize()          // Get base form (running → run)
    ↓
analyzeText()        // Generate frequency map
```

### Storage Integration

The content script interacts with IndexedDB through the storage layer:

- **Words Table**: Stores word frequencies across all pages
- **Reading Stats**: Daily statistics (words read, domains visited)
- **Translation Cache**: Cached translations (managed by background)

## Performance Optimizations

1. **Debouncing**: Text extraction debounced to 200ms
2. **Throttling**: Analysis throttled to once per 5 seconds
3. **Batch Operations**: Bulk insert/update for database operations
4. **Smart Filtering**: Early filtering of non-content elements
5. **Incremental Updates**: Merge new frequencies with existing data

## Settings & Configuration

Content script respects user settings:

- `autoAnalysis`: Enable/disable automatic word counting
- `blacklistDomains`: Domains to exclude from analysis
- `whitelistDomains`: Only analyze these domains (if set)
- `enableShortcuts`: Keyboard shortcuts for translation

## Error Handling

- Graceful degradation if analysis fails
- Fallback to full page extraction if main content not found
- Console logging for debugging (prefixed with `[English Reading Assistant]`)
- Try-catch blocks around all async operations

## Browser Compatibility

- Chrome/Chromium: Full support (Manifest V3)
- Edge: Full support
- Firefox: Partial support (requires Manifest V2 adaptation)
- Safari: Not supported (different extension API)

## Testing Recommendations

Test on various page types:

1. **Static Pages**: News articles, blogs
2. **SPAs**: React/Vue/Angular apps
3. **Dynamic Content**: Infinite scroll, lazy loading
4. **Complex Layouts**: Multi-column, sidebars
5. **Edge Cases**: Empty pages, code documentation, PDFs

## Known Limitations

1. **Code Documentation**: Code blocks are excluded by default
2. **PDFs**: Limited support (requires PDF.js integration)
3. **Canvas/SVG Text**: Not extracted
4. **Shadow DOM**: Limited support
5. **iFrames**: Content not accessible due to security restrictions

## Future Enhancements

- [ ] Configurable code block analysis
- [ ] PDF text extraction support
- [ ] Shadow DOM support
- [ ] Reading progress tracking
- [ ] Highlight difficult words on page
- [ ] Word difficulty classification (CEFR levels)
- [ ] Phrase detection and analysis
- [ ] Reading speed estimation per domain

## Debugging

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('era_debug', 'true');
```

Check content script status:

```javascript
// In browser console
chrome.runtime.sendMessage({ type: 'GET_CONTENT_STATUS' });
```

## API Reference

### ContentObserver

```typescript
class ContentObserver {
  constructor(callback: () => void, debounceMs?: number)
  start(): void
  stop(): void
}
```

### SelectionHandler

```typescript
class SelectionHandler {
  enable(): void
  disable(): void
  setMinLength(length: number): void
  setMaxLength(length: number): void
}
```

### Text Extraction

```typescript
function extractPageText(): string
function extractMainContent(): string
function getPageMetadata(): PageMetadata
function shouldAnalyzePage(): Promise<boolean>
```

## Contributing

When modifying the content script:

1. Test on multiple websites
2. Check performance impact (use Chrome DevTools Performance tab)
3. Ensure no conflicts with page styles/scripts
4. Update this README if adding new features
5. Add error handling for all async operations
