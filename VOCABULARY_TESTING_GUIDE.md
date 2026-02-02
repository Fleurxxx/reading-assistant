# Vocabulary Management Testing Guide

## Quick Start

To test the vocabulary management features:

1. **Build the extension**:
   ```bash
   npm run build
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Open the side panel**:
   - Click the extension icon
   - Or right-click and select "Open side panel"

## Feature Testing Checklist

### 1. Adding Vocabulary (Translation Tab)

**Steps:**
1. Navigate to any English webpage
2. Select a word or phrase
3. The side panel should open to the Translation tab
4. View the translation
5. Click "Add to Vocabulary" button

**Expected Results:**
- ✅ Button shows "Added to Vocabulary" with checkmark icon
- ✅ Button changes to green background
- ✅ Word is saved to database
- ✅ Can now find word in Vocabulary tab

**Test Cases:**
- Try adding same word twice (should show already saved)
- Try adding word with special characters
- Try adding multi-word phrase
- Try adding word without examples

---

### 2. Viewing Vocabulary (Vocabulary Tab)

**Steps:**
1. Click the "Vocabulary" tab
2. View the vocabulary list

**Expected Results:**
- ✅ Statistics show correct counts (Total, Mastered, Learning)
- ✅ All saved words are displayed
- ✅ Cards show word, translation, and date added
- ✅ Smooth scrolling with custom scrollbar
- ✅ Empty state shows when no vocabulary

**Test Cases:**
- View with 0 words (empty state)
- View with 1-5 words
- View with 20+ words (test scrolling)
- View with mastered and learning words

---

### 3. Search Functionality

**Steps:**
1. Add several words to vocabulary
2. Go to Vocabulary tab
3. Type in the search box

**Expected Results:**
- ✅ Results filter in real-time
- ✅ Matches words (case-insensitive)
- ✅ Matches translations
- ✅ Shows "No matches found" when appropriate
- ✅ Clear search resets results

**Test Cases:**
- Search for partial word (e.g., "hel" finds "hello")
- Search for translation text
- Search for non-existent word
- Search with special characters
- Clear search (delete text)

---

### 4. Filter by Mastery Status

**Steps:**
1. Have some mastered and some learning words
2. Click "Filters" button
3. Select different mastery filters

**Expected Results:**
- ✅ "All" shows all words
- ✅ "Learning" shows only non-mastered words
- ✅ "Mastered" shows only mastered words
- ✅ Statistics update correctly
- ✅ Active filter shows badge count

**Test Cases:**
- Filter when all words are learning
- Filter when all words are mastered
- Filter when mixed
- Combine with search

---

### 5. Tag Management

**Steps:**
1. Click edit icon on a word card
2. Type a tag name and press Enter or click +
3. Add multiple tags
4. Click X to remove a tag
5. Click "Filters" and select tags to filter

**Expected Results:**
- ✅ Tag is added immediately
- ✅ Tag appears as colored badge
- ✅ Tags are saved to database
- ✅ Can remove tags
- ✅ Cannot add duplicate tags
- ✅ Can filter by multiple tags
- ✅ Tag filter shows all unique tags

**Test Cases:**
- Add single tag
- Add multiple tags to one word
- Remove tag from word
- Try adding same tag twice (should prevent)
- Add tags with spaces (should work)
- Filter by one tag
- Filter by multiple tags
- Combine tag filter with mastery filter

---

### 6. Mastery Toggle

**Steps:**
1. Find a learning word (no checkmark)
2. Click the circle icon
3. Find a mastered word (has checkmark)
4. Click the checkmark icon

**Expected Results:**
- ✅ Learning → Mastered: Circle → Checkmark, border turns green
- ✅ Mastered → Learning: Checkmark → Circle, border turns gray
- ✅ Statistics update immediately
- ✅ Status persists after refresh
- ✅ Mastery filter works with new status

**Test Cases:**
- Toggle from learning to mastered
- Toggle from mastered to learning
- Toggle multiple words
- Verify persistence (reload extension)
- Check statistics accuracy

---

### 7. Audio Pronunciation

**Steps:**
1. Click the speaker icon on a word card
2. Listen to pronunciation

**Expected Results:**
- ✅ Word is pronounced using Web Speech API
- ✅ Icon shows pulse animation during playback
- ✅ English (US) accent
- ✅ Moderate speed (0.8x)
- ✅ Works for single words and phrases

**Test Cases:**
- Play pronunciation of single word
- Play pronunciation of phrase
- Try multiple words in succession
- Verify animation during playback
- Test in different browsers (if applicable)

---

### 8. Delete Functionality

**Steps:**
1. Click the trash icon on a word card
2. Confirm deletion in dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Word is removed from list
- ✅ Word is deleted from database
- ✅ Statistics update
- ✅ Cannot undo deletion

**Test Cases:**
- Delete word and confirm
- Delete word and cancel
- Delete last word (should show empty state)
- Verify persistence (word stays deleted after refresh)

---

### 9. Example Sentences

**Steps:**
1. Find word with examples
2. Click "Show Examples (N)"
3. Click "Hide Examples (N)"

**Expected Results:**
- ✅ Examples expand smoothly
- ✅ Examples are styled with left border
- ✅ Examples hide smoothly
- ✅ Button text toggles
- ✅ Chevron icon rotates

**Test Cases:**
- Expand examples
- Collapse examples
- Word with 1 example
- Word with multiple examples
- Word with no examples (button not shown)

---

### 10. Export to CSV

**Steps:**
1. Add several words with various data (tags, examples, etc.)
2. Click "Export" button in header

**Expected Results:**
- ✅ CSV file downloads
- ✅ Filename: `vocabulary_YYYY-MM-DD.csv`
- ✅ File opens in Excel/Google Sheets
- ✅ All fields present: Word, Translation, Mastered, Tags, Added Date, Examples
- ✅ Special characters handled correctly
- ✅ Button disabled when no vocabulary

**Test Cases:**
- Export with 1 word
- Export with 20+ words
- Export with special characters
- Export with multiple tags
- Export with long examples
- Verify CSV format in text editor
- Open in Excel
- Open in Google Sheets

---

### 11. Sort Functionality

**Steps:**
1. Have multiple words added at different times
2. Select "Newest First" in sort dropdown
3. Select "A-Z" in sort dropdown

**Expected Results:**
- ✅ Newest First: Most recent at top
- ✅ A-Z: Alphabetical order
- ✅ Sort persists during search/filter
- ✅ Smooth reordering

**Test Cases:**
- Sort by date
- Sort alphabetically
- Sort with filters active
- Sort with search active

---

### 12. Tab Navigation

**Steps:**
1. Switch between Translation and Vocabulary tabs
2. Select text while on Vocabulary tab
3. Click a word in Vocabulary tab

**Expected Results:**
- ✅ Tabs switch smoothly
- ✅ State preserved in each tab
- ✅ New translation auto-switches to Translation tab
- ✅ Clicking word in Vocabulary switches to Translation tab and shows details
- ✅ Tab indicators (icons and colors) work correctly

**Test Cases:**
- Manual tab switching
- Auto-switch on translation
- Click word to view in translation tab
- Verify state preservation (filters stay active when switching back)

---

### 13. Dark Mode

**Steps:**
1. Enable dark mode in system settings
2. Verify extension follows system preference
3. Test all features in dark mode

**Expected Results:**
- ✅ Background colors invert appropriately
- ✅ Text remains readable
- ✅ Icons adjust colors
- ✅ Borders and accents visible
- ✅ Hover states work
- ✅ Scrollbar styled for dark mode
- ✅ All components support dark mode

**Test Cases:**
- View in light mode
- View in dark mode
- Toggle between modes
- Check all cards and buttons
- Verify animations in dark mode

---

### 14. Cross-Tab Word Selection

**Steps:**
1. Add several words to vocabulary
2. Go to Vocabulary tab
3. Click on a word card

**Expected Results:**
- ✅ Switches to Translation tab
- ✅ Shows word details
- ✅ Translation displayed
- ✅ Examples shown (if available)
- ✅ Can play pronunciation

**Test Cases:**
- Click word with examples
- Click word without examples
- Click word with pronunciation
- Verify all data displays correctly

---

### 15. Responsive Layout

**Steps:**
1. Adjust side panel width (if possible)
2. Scroll through long lists
3. Test on different screen sizes

**Expected Results:**
- ✅ Layout adapts to width
- ✅ No horizontal scrolling
- ✅ Text wraps appropriately
- ✅ Buttons remain accessible
- ✅ Cards don't break layout

**Test Cases:**
- Minimum width
- Maximum width
- Normal width (~400px)
- Very long words
- Very long translations

---

## Performance Testing

### Expected Performance:
- ✅ List renders in <100ms for 100 words
- ✅ Search filters in real-time (<50ms)
- ✅ Smooth scrolling (60fps)
- ✅ No lag when toggling mastery
- ✅ Quick database operations (<100ms)

### Load Testing:
1. Add 50+ words
2. Test search responsiveness
3. Test filter combinations
4. Test scrolling performance
5. Test export with large dataset

---

## Browser Compatibility

Test in:
- ✅ Chrome/Chromium
- ✅ Edge
- ✅ Brave
- ✅ Opera (Chromium-based)

---

## Edge Cases

### 1. Empty States
- No vocabulary saved
- Search with no results
- Filter with no matches
- All words mastered
- All words learning

### 2. Data Limits
- Very long word (100+ chars)
- Very long translation (1000+ chars)
- Many examples (10+)
- Many tags (20+)
- Large vocabulary (1000+ words)

### 3. Special Characters
- Words with apostrophes (it's, won't)
- Words with hyphens (well-being)
- Non-English characters (café)
- Numbers (COVID-19)
- Punctuation in tags

### 4. Concurrent Operations
- Add word while filtering
- Delete word while searching
- Toggle mastery during filter
- Edit tags while viewing

### 5. Error Scenarios
- Database connection error
- Export failure
- Audio playback unavailable
- Duplicate word handling

---

## Success Criteria

The vocabulary management system passes testing if:

- ✅ All 15 core features work as expected
- ✅ No console errors during normal use
- ✅ Data persists across sessions
- ✅ UI is responsive and smooth
- ✅ Dark mode fully functional
- ✅ Export produces valid CSV
- ✅ No data loss on operations
- ✅ Performance meets targets
- ✅ Edge cases handled gracefully
- ✅ Accessibility requirements met

---

## Bug Reporting Template

If you find a bug, report it with:

```
**Bug**: [Brief description]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Browser**: [Chrome version]
**Console Errors**: [Any errors]
**Screenshots**: [If applicable]
```

---

## Automated Testing (Future)

Consider adding:
- Unit tests for VocabularyRepository
- Integration tests for components
- E2E tests with Playwright
- Performance benchmarks
- Visual regression tests

---

Happy Testing! 🎉
