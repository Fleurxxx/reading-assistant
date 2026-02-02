# Popup Statistics Dashboard

## Overview

The popup provides a comprehensive statistics dashboard that displays reading analytics, word frequency data, and vocabulary metrics when users click the extension icon.

## Files

- **popup.html** - HTML entry point for the popup
- **index.tsx** - React root component initialization
- **StatsView.tsx** - Main statistics dashboard component

## Features

### 1. Today's Statistics Cards
- **Words Today**: Total words read today
- **Translations**: Number of translations performed
- **Sites Visited**: Unique domains visited
- **Reading Time**: Estimated reading time in minutes

### 2. All-Time Statistics
Displayed when user has more than 1 day of data:
- Total words read across all sessions
- Total days active
- Total translations performed
- Total reading time

### 3. Top 10 Words Chart
- Bar chart showing the most frequently encountered words
- Uses Chart.js for visualization
- Interactive tooltips with word frequency

### 4. 7-Day Trend Chart
- Line chart showing reading activity over the past week
- Two datasets:
  - Words Read (blue line)
  - Translations (purple line)
- Helps users track their reading consistency

### 5. Vocabulary Collection
- Displays total number of saved vocabulary words
- Quick access button to view full vocabulary list
- Opens the options page when clicked

### 6. Quick Actions
- **Open Translation Panel**: Opens the side panel for translations
- **Refresh**: Reload statistics data

## Data Sources

The popup pulls data from multiple repositories:

- `statsRepository.getTodayStats()` - Today's reading statistics
- `statsRepository.getRecentStats(7)` - Last 7 days of data
- `statsRepository.getAllTimeStats()` - Cumulative statistics
- `wordRepository.getTopWords(10)` - Most frequent words
- `db.vocabulary.count()` - Total saved vocabulary

## Design

- **Width**: 400px
- **Max Height**: 600px with scrolling
- **Theme**: Supports light and dark mode via Tailwind
- **Colors**:
  - Primary: Sky blue (#0ea5e9)
  - Secondary colors: Purple, Green, Orange for different metrics
- **Icons**: Lucide React icons for visual elements

## User Experience

### Loading State
- Displays a spinner with "Loading statistics..." message
- Ensures smooth user experience while data loads

### Error State
- Shows error message with retry button
- Handles database access failures gracefully

### Empty State
- Works correctly even with no data
- Shows 0 values and empty charts

## Performance

- All data fetching happens in parallel using `Promise.all`
- Efficient IndexedDB queries using Dexie
- Charts are rendered only when data is available
- Minimal re-renders with React hooks

## Browser API Usage

- `chrome.runtime.openOptionsPage()` - Opens vocabulary management
- `chrome.tabs.query()` - Gets active tab
- `chrome.sidePanel.open()` - Opens translation panel
- `window.close()` - Closes popup after action

## Future Enhancements

- Export statistics to CSV/PDF
- More detailed domain-wise breakdowns
- Reading streak tracking
- Daily/weekly goals and achievements
- Comparison with previous periods
