# Options Page

The options page provides a comprehensive settings interface for configuring the English Reading Assistant extension.

## Features

### General Settings
- **Auto Analysis**: Toggle automatic text analysis on visited pages
- **Keyboard Shortcuts**: Enable/disable keyboard shortcuts for quick translation

### Appearance
- **Theme**: Choose between Light, Dark, or Auto (system preference)
- **Font Size**: Adjust font size from 12px to 20px
- **Side Panel Position**: Configure whether the side panel appears on the left or right

### Domain Management
- **Blacklist Domains**: Disable word analysis on specific domains
- **Whitelist Domains**: Only analyze text on specific domains (restrictive mode)
- Support for wildcard patterns (e.g., `*.google.com`)

### Translation API
- **Youdao API Configuration**: Input App Key and App Secret for translation service
- Secure storage in chrome.storage.local

### Advanced
- **Export Settings**: Save current configuration to JSON file
- **Import Settings**: Restore configuration from previously exported file
- **Reset to Defaults**: Restore all settings to factory defaults

## Files

- `options.html` - HTML entry point
- `index.tsx` - React entry point
- `SettingsForm.tsx` - Main settings component with all configuration options
- `options.css` - Custom styles for the options page
- `README.md` - This documentation file

## Usage

Users can access the options page by:
1. Right-clicking the extension icon and selecting "Options"
2. Going to `chrome://extensions` and clicking "Details" → "Extension options"

## Implementation Details

### State Management
- Uses React hooks for local state management
- Persists settings to `chrome.storage.local`
- Immediate theme application without requiring page reload

### Validation
- Domain format validation using regex patterns
- Duplicate domain prevention
- Required field validation for API credentials

### User Experience
- Success/error notifications with auto-dismiss
- Loading states during save operations
- Confirmation dialogs for destructive actions
- Real-time preview of font size and theme changes

## Settings Schema

```typescript
interface AppSettings {
  autoAnalysis: boolean;
  blacklistDomains: string[];
  whitelistDomains: string[];
  sidePanelPosition: 'left' | 'right';
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  enableShortcuts: boolean;
}

interface APICredentials {
  appKey: string;
  appSecret: string;
}
```

## Security

- API credentials stored securely in chrome.storage.local
- Password input type for App Secret field
- No credentials included in error messages or logs
