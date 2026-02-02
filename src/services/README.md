# Translation Services

This directory contains the complete translation service implementation for the English Reading Assistant extension, featuring Youdao API integration with a sophisticated two-tier caching system.

## Architecture

```
services/
├── translationAdapter.ts    # Interface and error types
├── youdaoTranslator.ts      # Youdao API implementation
├── translationCache.ts      # Two-tier caching layer
├── translationService.ts    # Main service combining cache + adapter
├── index.ts                 # Module exports
├── examples.ts              # Usage examples
└── testUtils.ts             # Testing utilities
```

## Core Components

### 1. TranslationAdapter Interface (`translationAdapter.ts`)

Defines a flexible interface for translation providers, making it easy to add support for other services (Google Translate, DeepL, etc.) in the future.

**Features:**
- Standard interface for any translation service
- Custom error class with error codes
- Type-safe credentials interface
- Comprehensive error codes (NO_CREDENTIALS, RATE_LIMIT, etc.)

### 2. Youdao Translator (`youdaoTranslator.ts`)

Complete implementation of the Youdao Translation API with enterprise-grade features.

**Features:**
- ✅ SHA256 signature generation for API authentication
- ✅ Request queue with 100ms delay to prevent rate limiting
- ✅ Automatic credential loading from Chrome storage
- ✅ Comprehensive error handling with mapped error codes
- ✅ Support for phonetic pronunciation, explanations, and web translations
- ✅ Text length validation (max 5000 characters)
- ✅ Language support (English to Chinese by default)

**API Error Handling:**
- All Youdao error codes (101-401) are mapped to friendly messages
- Automatic detection of credential issues
- Network error recovery
- Rate limit detection

### 3. Translation Cache (`translationCache.ts`)

Two-tier caching system for optimal performance.

**Features:**
- ✅ **Memory Cache (L1)**: LRU cache with 100 entries for instant access
- ✅ **IndexedDB Cache (L2)**: Persistent cache with 30-day expiration
- ✅ Automatic cache hit/miss statistics tracking
- ✅ Cache normalization (lowercase, whitespace handling)
- ✅ Expired entry cleanup
- ✅ Pre-loading support for common words
- ✅ Cache size estimation
- ✅ Export/import functionality

**Performance:**
- Target: >70% cache hit rate
- Memory cache: <1ms access time
- IndexedDB cache: ~10-20ms access time
- API call: ~500-1000ms (avoided with cache)

### 4. Translation Service (`translationService.ts`)

Main service that orchestrates the adapter and caching layer.

**Features:**
- ✅ Cache-first strategy (check cache → API → store cache)
- ✅ Single translation with automatic caching
- ✅ Batch translation support
- ✅ Cache management (clear, stats, cleanup)
- ✅ Adapter switching support (for future providers)
- ✅ Pre-load cache with common words
- ✅ Automatic error handling

**Usage Example:**
```typescript
import { translationService } from '@/services';

// Simple translation (cache-first)
const result = await translationService.translate('hello');
console.log(result.translation); // "你好"

// Batch translation
const results = await translationService.translateBatch(['apple', 'banana']);

// Get cache statistics
const stats = await translationService.getCacheStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

## Data Flow

```
User selects text
    ↓
Content Script → Background Service Worker
    ↓
TranslationService.translate(text)
    ↓
Check Memory Cache (L1)
    ↓ (miss)
Check IndexedDB Cache (L2)
    ↓ (miss)
YoudaoTranslator.translate(text)
    ↓ (with request queue)
Youdao API Call
    ↓
Store in both caches
    ↓
Return result → Side Panel
```

## Configuration

### Setting Up Youdao API Credentials

```typescript
import { youdaoTranslator } from '@/services';

// Save credentials
await youdaoTranslator.setCredentials(
  'your-app-key',
  'your-app-secret'
);

// Check if configured
const isConfigured = await youdaoTranslator.isConfigured();
```

Get credentials at: https://ai.youdao.com/

## Testing & Debugging

The `testUtils.ts` file provides comprehensive testing utilities:

```typescript
import { translationTests } from '@/services';

// Run all tests
await translationTests.run();

// Performance benchmark
await translationTests.benchmark();

// View cache statistics
await translationTests.showCache();

// Pre-load common words
await translationTests.preload();

// Clean expired entries
await translationTests.cleanup();

// Export cache for backup
const json = await translationTests.export();
```

## Error Handling

All translation errors use the `TranslationError` class with specific error codes:

- `NO_CREDENTIALS`: API credentials not configured
- `INVALID_CREDENTIALS`: Invalid API credentials
- `RATE_LIMIT`: API rate limit exceeded
- `TEXT_TOO_LONG`: Text exceeds 5000 characters
- `INVALID_LANGUAGE`: Unsupported language pair
- `NETWORK_ERROR`: Network connection failed
- `API_ERROR`: Generic API error
- `UNKNOWN_ERROR`: Unexpected error

## Performance Optimizations

1. **Two-tier caching**: Memory cache for instant access, IndexedDB for persistence
2. **Request queuing**: Prevents rate limiting with 100ms delay between requests
3. **Text normalization**: Maximizes cache hits (case-insensitive, whitespace handling)
4. **LRU eviction**: Keeps most recent 100 translations in memory
5. **Batch processing**: Efficiently handles multiple translations

## Cache Statistics

The cache provides detailed statistics:

```typescript
{
  totalEntries: 245,      // Total cached translations
  memoryCacheSize: 100,   // Current memory cache size
  hitRate: 0.78,          // 78% cache hit rate
  hits: 156,              // Cache hits count
  misses: 44              // Cache misses count
}
```

## Integration with Chrome Extension

### Background Service Worker
```typescript
import { setupBackgroundTranslationHandler } from '@/services/examples';

// Set up message listener
setupBackgroundTranslationHandler();
```

### Content Script
```typescript
import { MessageType, sendMessage } from '@/utils/messaging';

// Request translation
await sendMessage({
  type: MessageType.TRANSLATE_TEXT,
  data: { text: selectedText }
});
```

### Side Panel
```typescript
import { addMessageListener, MessageType } from '@/utils/messaging';

// Listen for translation results
addMessageListener((message) => {
  if (message.type === MessageType.TRANSLATION_RESULT) {
    displayTranslation(message.data);
  }
});
```

## Dependencies

- `crypto-js`: SHA256 signature generation for Youdao API
- `dexie`: IndexedDB wrapper for cache persistence
- Chrome Extension APIs: `chrome.storage`, `chrome.runtime`

## Future Enhancements

- [ ] Support for additional translation providers (Google, DeepL)
- [ ] Offline translation using local dictionary
- [ ] Translation history tracking
- [ ] Custom phrase dictionary
- [ ] Audio pronunciation playback
- [ ] Translation quality feedback

## License

Part of the English Reading Assistant Chrome Extension project.
