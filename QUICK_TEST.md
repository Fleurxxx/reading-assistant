# Quick Testing Guide

This guide provides a fast way to test the English Reading Assistant extension after building.

## Prerequisites

1. Build the extension:
   ```bash
   npm install
   npm run build
   ```

2. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Quick Test Checklist (5 minutes)

### 1. Basic Functionality Test

**Test Site**: https://www.wikipedia.org

1. ✅ Navigate to any Wikipedia article
2. ✅ Wait 3-5 seconds for analysis to complete
3. ✅ Click the extension icon - verify statistics show word count
4. ✅ Select any word or phrase on the page
5. ✅ Verify side panel opens with translation (requires API keys in settings)

**Expected Results**:
- Extension icon shows active state
- Word count appears in popup
- Text selection triggers side panel
- No console errors

### 2. Settings Test

1. ✅ Right-click extension icon → Options
2. ✅ Verify settings page opens
3. ✅ Toggle "Auto Analysis" off and on
4. ✅ Change theme (Light/Dark/Auto)
5. ✅ Add a domain to blacklist (e.g., `example.com`)
6. ✅ Click "Save Settings"

**Expected Results**:
- Settings save successfully
- Success message appears
- Theme changes immediately

### 3. Translation Test (Requires API Keys)

**Setup First**: Add Youdao API credentials in settings

1. ✅ Go to any English article
2. ✅ Select text: "Hello world"
3. ✅ Right-click → "Translate 'Hello world'"
4. ✅ Verify side panel shows Chinese translation

**Alternative** (without API keys):
- Use keyboard shortcut: `Ctrl+Shift+T` (Windows) or `Cmd+Shift+T` (Mac)
- Should see error message about missing credentials

### 4. Vocabulary Test

1. ✅ Translate any word
2. ✅ Click "Add to Vocabulary" in side panel
3. ✅ Open popup → Navigate to vocabulary section
4. ✅ Verify word appears in list
5. ✅ Delete the word

**Expected Results**:
- Word saves successfully
- Appears in vocabulary list
- Can be deleted

### 5. Performance Test

**Test Site**: https://en.wikipedia.org/wiki/History_of_the_United_States

1. ✅ Open the article (long content)
2. ✅ Open browser console (F12)
3. ✅ Look for performance logs
4. ✅ Check text extraction time < 100ms
5. ✅ Memory usage reasonable (< 50MB)

**Check Console**:
```javascript
// Run in console
window.eraTest?.debugExtensionState();
```

## Automated Test Suite

Run comprehensive tests in the browser console:

```javascript
// Load any page with the extension active
// Open console (F12) and run:

await window.eraTest?.runAllTests();
```

**Expected Output**:
```
=== Running Extension Tests ===

[Test] PASS: Text Extraction (45ms)
[Test] PASS: Text Processing (120ms)
[Test] PASS: Database Operations (35ms)
[Test] PASS: Translation Cache (25ms)
[Test] PASS: Stress Test: Large Text (850ms)
[Test] PASS: Stress Test: DB Inserts (450ms)

=== Performance Summary ===
[Performance metrics table]

[Test Summary]
Total: 6 | Passed: 6 | Failed: 0
Success Rate: 100.0%
```

## Test Different Site Types

### Quick 3-Site Test (2 minutes each)

1. **News Site**: https://www.bbc.com/news
   - ✅ Proper content extraction
   - ✅ Ads/sidebars excluded
   - ✅ Word counting accurate

2. **Technical Docs**: https://developer.mozilla.org/en-US/docs/Web/JavaScript
   - ✅ Code blocks excluded
   - ✅ Only text analyzed
   - ✅ Technical terms counted

3. **E-commerce**: https://www.amazon.com
   - ✅ Product descriptions extracted
   - ✅ Navigation excluded
   - ✅ Minimal false positives

## Performance Benchmarks

Run benchmark tests:

```javascript
// In console
const { benchmark } = window.eraTest;

// Test text extraction
await benchmark('Text Extraction', async () => {
  const { extractMainContent } = await import('./content/textExtractor');
  extractMainContent();
}, 50);

// Test database query
await benchmark('DB Query', async () => {
  const { db } = await import('./storage/db');
  await db.words.limit(10).toArray();
}, 100);
```

**Target Times**:
- Text Extraction: < 50ms average
- DB Query: < 10ms average
- Text Processing: < 100ms average

## Debug Tools

### 1. Check Extension State

```javascript
// In console on any page
await window.eraTest?.debugExtensionState();
```

Shows:
- Current settings
- Database statistics
- Performance metrics
- Memory usage

### 2. View Performance Logs

```javascript
// Enable debug mode
localStorage.setItem('era_debug', 'true');

// View performance summary
window.eraTest?.perfMonitor.logSummary();
```

### 3. Test Specific Features

```javascript
// Test text extraction
await window.eraTest?.testTextExtraction();

// Test database
await window.eraTest?.testDatabaseOperations();

// Test translation cache
await window.eraTest?.testTranslationCache();
```

### 4. Inspect Database

1. Open DevTools (F12)
2. Application tab
3. IndexedDB → EnglishReadingAssistantDB
4. Browse tables:
   - `words` - Word frequency data
   - `vocabulary` - Saved vocabulary
   - `translationCache` - Cached translations
   - `readingStats` - Daily statistics

## Common Issues & Solutions

### Issue: No word count showing

**Solution**:
1. Check if domain is blacklisted (Settings)
2. Verify auto-analysis is enabled
3. Refresh the page
4. Check console for errors

### Issue: Translation not working

**Solution**:
1. Verify API keys are set (Settings → Translation API)
2. Check network tab for API errors
3. Try with simple word like "hello"

### Issue: Extension slowing down browser

**Solution**:
1. Add current site to blacklist
2. Increase throttle time (not in UI yet, requires code change)
3. Clear old statistics
4. Restart browser

### Issue: Performance tests failing

**Solution**:
1. Close other tabs
2. Run tests on a fresh page load
3. Clear browser cache
4. Check for browser extensions conflicts

## Smoke Test Script (30 seconds)

Quick validation that everything works:

```javascript
// Run in console on any English article page
(async () => {
  console.log('🧪 Running smoke test...');
  
  // 1. Check extension loaded
  if (!window.eraTest) {
    console.error('❌ Extension not loaded');
    return;
  }
  
  // 2. Test text extraction
  const textTest = await window.eraTest.testTextExtraction();
  console.log(textTest ? '✅ Text extraction working' : '❌ Text extraction failed');
  
  // 3. Test database
  const dbTest = await window.eraTest.testDatabaseOperations();
  console.log(dbTest ? '✅ Database working' : '❌ Database failed');
  
  // 4. Check memory
  const memory = performance.memory;
  const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
  console.log(`📊 Memory usage: ${usedMB} MB ${usedMB < 100 ? '✅' : '⚠️'}`);
  
  console.log('✨ Smoke test complete!');
})();
```

## Test Report Template

After testing, document results:

```markdown
## Test Report - [Date]

**Tester**: [Your Name]
**Version**: 1.0.0
**Browser**: Chrome [Version]

### Results
- [ ] Basic functionality: PASS/FAIL
- [ ] Settings: PASS/FAIL
- [ ] Translation: PASS/FAIL
- [ ] Vocabulary: PASS/FAIL
- [ ] Performance: PASS/FAIL

### Performance Metrics
- Text Extraction: XXms
- Database Query: XXms
- Memory Usage: XXMB

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Any additional observations]
```

## Next Steps

After quick testing:

1. ✅ Run full test suite (see TESTING_AND_OPTIMIZATION_GUIDE.md)
2. ✅ Test on all 12 recommended sites
3. ✅ Perform stress tests
4. ✅ Monitor over 30-minute session
5. ✅ Generate full test report

## Getting Help

If tests fail:
1. Check browser console for errors
2. Review background service worker logs
3. Inspect IndexedDB for data issues
4. Check network tab for API failures
5. Review TESTING_AND_OPTIMIZATION_GUIDE.md for detailed troubleshooting
