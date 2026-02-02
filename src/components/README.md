# Components

This directory contains shared UI components used across the extension.

## VocabularyList

A comprehensive component for displaying and managing saved vocabulary words.

### Features

- **Search**: Full-text search across words and translations
- **Filtering**: 
  - Filter by mastery status (All, Learning, Mastered)
  - Filter by tags (multi-select)
- **Sorting**: Sort by date added or alphabetically
- **Statistics**: View total words, mastered count, and learning count
- **Export**: Export vocabulary to CSV format
- **Responsive**: Optimized for side panel display

### Usage

```tsx
import VocabularyList from '../components/VocabularyList';

function MyComponent() {
  const handleWordSelect = (vocab: Vocabulary) => {
    // Handle word selection
    console.log('Selected word:', vocab.word);
  };

  return <VocabularyList onWordSelect={handleWordSelect} />;
}
```

### Props

- `onWordSelect?: (word: Vocabulary) => void` - Callback when a word is clicked

## WordCard

A reusable card component for displaying individual vocabulary entries.

### Features

- **Display**: Shows word, translation, pronunciation, and examples
- **Audio**: Play pronunciation using Web Speech API
- **Mastery Toggle**: Mark words as mastered or learning
- **Tag Management**: Add, edit, and remove tags
- **Delete**: Remove words from vocabulary
- **Expandable**: Show/hide example sentences

### Usage

```tsx
import WordCard from './WordCard';

function MyComponent({ vocabulary }: { vocabulary: Vocabulary }) {
  const handleUpdate = () => {
    // Refresh the vocabulary list
    console.log('Word updated');
  };

  const handleDelete = () => {
    // Handle deletion
    console.log('Word deleted');
  };

  return (
    <WordCard
      vocabulary={vocabulary}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onClick={() => console.log('Word clicked')}
    />
  );
}
```

### Props

- `vocabulary: Vocabulary` - The vocabulary entry to display
- `onUpdate?: () => void` - Callback when the word is updated
- `onDelete?: () => void` - Callback when the word is deleted
- `onClick?: () => void` - Callback when the word is clicked

## Tag Management

Both `VocabularyList` and `WordCard` support tag management:

1. **View Tags**: Tags are displayed as colored badges
2. **Filter by Tag**: In VocabularyList, click tags in the filter section
3. **Add Tags**: In WordCard, click the edit icon and type a new tag
4. **Remove Tags**: In edit mode, click the X button on a tag

## Export to CSV

The `VocabularyList` component provides CSV export functionality:

- Click the "Export" button in the header
- Downloads a CSV file with format: `vocabulary_YYYY-MM-DD.csv`
- Includes: Word, Translation, Mastered status, Tags, Added Date, Examples

### CSV Format

```csv
Word,Translation,Mastered,Tags,Added Date,Examples
"hello","你好","Yes","greetings; basic","2024-01-01","Hello, how are you? | Hello world!"
```

## Mastery Tracking

Words can be marked as:

- **Learning** (default): Words you're currently learning
- **Mastered**: Words you've mastered

Toggle mastery status by clicking the circle/checkmark icon on any word card.

## Styling

All components use Tailwind CSS with dark mode support. Custom animations are defined in `sidepanel.css`:

- `animate-slide-in`: Smooth entry animation
- `animate-audio-pulse`: Audio playback indicator
- `line-clamp-2`: Text truncation utility

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Focus indicators on all buttons
- Semantic HTML structure
