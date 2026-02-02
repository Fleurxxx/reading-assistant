# Background Service Worker

The background service worker is the heart of the English Reading Assistant extension, coordinating all operations and managing communication between different components.

## Architecture

The background worker is organized into modular components:

### Main Components

1. **index.ts** - Main service worker entry point
   - Initializes all handlers and listeners
   - Sets up context menus and keyboard commands
   - Manages installation and update events

2. **messageHandler.ts** - Message processing
   - Handles all incoming messages from content scripts and UI
   - Processes translation requests
   - Manages vocabulary and settings operations
   - Batch word updates for performance

3. **alarmHandler.ts** - Scheduled tasks
   - Daily stats reset (midnight)
   - Cache cleanup (hourly)
   - Stats cleanup (daily)
   - Backup reminders (weekly)

## Message Types

The service worker handles the following message types:

### Translation & Content
- `TRANSLATE_TEXT` - Translate selected text
- `EXTRACT_TEXT` - Process extracted text from pages
- `BATCH_WORD_UPDATE` - Batch update word statistics

### Vocabulary
- `SAVE_VOCABULARY` - Add word to vocabulary collection

### Settings
- `GET_SETTINGS` - Retrieve current settings
- `UPDATE_SETTINGS` - Update settings and broadcast to tabs

### UI Control
- `OPEN_SIDE_PANEL` - Open translation side panel
- `GET_SELECTION` - Request current text selection

## Features

### Context Menu Integration
- Right-click selected text to translate
- Automatically opens side panel with results

### Keyboard Shortcuts
- `Ctrl+Shift+T` (Windows/Linux) / `Cmd+Shift+T` (Mac)
- Translates current selection instantly

### Scheduled Tasks

#### Hourly Tasks
- Clean expired translation cache
- Maintain cache size limits (max 1000 entries)

#### Daily Tasks (Midnight)
- Initialize new daily stats entry
- Clean old statistics (>90 days)
- Log previous day's reading activity

#### Weekly Tasks (Sunday)
- Send backup reminder notification
- Encourage vocabulary export

### Installation & Updates

#### First Install
- Initialize default settings
- Show welcome notification
- Open options page for API configuration

#### Updates
- Perform migration tasks if needed
- Log version changes

## Performance Optimizations

### Batch Processing
- Word updates processed in batches of 50
- Prevents blocking on large text analysis

### Efficient Caching
- Translation results cached in IndexedDB
- Automatic cleanup of expired/old entries
- Size-based eviction (LRU strategy)

### Error Handling
- Graceful degradation on failures
- Detailed logging for debugging
- User-friendly error messages

### Message Broadcasting
- Settings updates broadcast to all tabs
- Ensures consistent behavior across extension

## Data Flow

### Translation Request Flow
```
Content Script → Background → Translation Service → Cache/API
                    ↓
              Side Panel (Result Display)
                    ↓
              Stats Update (IndexedDB)
```

### Text Analysis Flow
```
Content Script → Text Extraction → Background → Word Processing
                                        ↓
                                  Batch Update → IndexedDB
                                        ↓
                                  Stats Aggregation
```

### Settings Flow
```
Options Page → Background → chrome.storage.local
                  ↓
            Broadcast to All Tabs → Content Scripts
```

## Security & Privacy

### Data Handling
- Only selected text sent to translation API
- Full page content stays local
- API credentials stored in chrome.storage.local

### Permissions
- Minimal permission requests
- No external tracking or analytics
- All data stored locally

## Testing Considerations

### Message Handler Testing
- Test each message type with valid/invalid data
- Verify error handling and responses
- Check concurrent request handling

### Alarm Testing
- Verify alarm creation and firing
- Test cleanup operations don't corrupt data
- Check notification permissions handling

### Installation Testing
- Test fresh install flow
- Verify update migration
- Check default settings initialization

## Debugging

### Enable Detailed Logging
The service worker includes comprehensive logging:
- `[Background]` - Main service events
- `[MessageHandler]` - Message processing
- `[AlarmHandler]` - Scheduled tasks

### View Service Worker
1. Go to `chrome://extensions`
2. Enable Developer Mode
3. Click "Service Worker" under extension
4. View console logs

### Inspect Messages
All messages logged with type and data for debugging.

## Future Enhancements

- [ ] Add support for offline mode
- [ ] Implement request queuing for rate limiting
- [ ] Add analytics for usage patterns (opt-in)
- [ ] Cloud sync support for vocabulary
- [ ] Advanced error recovery and retry logic
