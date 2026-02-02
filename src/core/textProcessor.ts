import { MAX_WORD_LENGTH, MIN_WORD_LENGTH } from "../utils/constants";
import { isProperNoun, lemmatize } from "./lemmatizer";
import { isStopWord } from "./stopWords";

/**
 * Word frequency data structure
 */
export interface WordFrequency {
  word: string;
  lemma: string;
  count: number;
  positions: number[]; // Character positions in text
}

/**
 * Result of text processing
 */
export interface TextAnalysisResult {
  totalWords: number;
  uniqueWords: number;
  wordFrequencies: Map<string, WordFrequency>;
  cleanedText: string;
  domain: string;
}

/**
 * Clean and preprocess text
 * - Remove extra whitespace
 * - Normalize punctuation
 * - Keep sentence structure for context
 */
export function cleanText(text: string): string {
  return (
    text
      // Normalize whitespace
      .replace(/\s+/g, " ")
      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Trim
      .trim()
  );
}

/**
 * Tokenize text into words
 * Handles contractions and hyphenated words
 */
export function tokenize(text: string): string[] {
  // Split on word boundaries, keeping contractions together
  const tokens = text.match(/\b[\w''-]+\b/g) || [];

  return tokens
    .map((token) => token.toLowerCase())
    .filter((token) => {
      // Remove pure numbers
      if (/^\d+$/.test(token)) return false;

      // Remove tokens that are too short or too long
      if (token.length < MIN_WORD_LENGTH || token.length > MAX_WORD_LENGTH) {
        return false;
      }

      // Remove tokens with too many special characters
      const alphaCount = (token.match(/[a-z]/gi) || []).length;
      if (alphaCount < token.length * 0.5) return false;

      return true;
    });
}

/**
 * Check if a word should be counted
 * Filters out stop words and invalid words
 */
export function shouldCountWord(word: string): boolean {
  if (!word || word.length < MIN_WORD_LENGTH) return false;
  if (isStopWord(word)) return false;

  // Skip words that are mostly numbers or special characters
  const alphaCount = (word.match(/[a-z]/gi) || []).length;
  return alphaCount >= word.length * 0.5;
}

/**
 * Analyze text and generate word frequency map
 */
export function analyzeText(text: string, domain: string = ""): TextAnalysisResult {
  const cleanedText = cleanText(text);
  const tokens = tokenize(cleanedText);

  const wordFrequencies = new Map<string, WordFrequency>();
  let totalWords = 0;

  // Track positions for context
  let currentPosition = 0;

  for (const token of tokens) {
    totalWords++;

    // Skip stop words and invalid words
    if (!shouldCountWord(token)) {
      currentPosition += token.length + 1; // +1 for space
      continue;
    }

    // Get lemma (base form)
    const lemma = isProperNoun(token) ? token : lemmatize(token);

    // Use lemma as key for frequency counting
    const key = lemma;

    if (wordFrequencies.has(key)) {
      const existing = wordFrequencies.get(key)!;
      existing.count++;
      existing.positions.push(currentPosition);
    } else {
      wordFrequencies.set(key, {
        word: token,
        lemma,
        count: 1,
        positions: [currentPosition],
      });
    }

    currentPosition += token.length + 1;
  }

  return {
    totalWords,
    uniqueWords: wordFrequencies.size,
    wordFrequencies,
    cleanedText,
    domain,
  };
}

/**
 * Merge word frequencies from multiple analyses
 * Useful for incremental page analysis
 */
export function mergeWordFrequencies(
  existing: Map<string, WordFrequency>,
  newData: Map<string, WordFrequency>
): Map<string, WordFrequency> {
  const merged = new Map(existing);

  for (const [word, freq] of newData) {
    if (merged.has(word)) {
      const existingFreq = merged.get(word)!;
      existingFreq.count += freq.count;
      existingFreq.positions.push(...freq.positions);
    } else {
      merged.set(word, { ...freq });
    }
  }

  return merged;
}

/**
 * Get top N words by frequency
 */
export function getTopWords(
  frequencies: Map<string, WordFrequency>,
  limit: number = 10
): WordFrequency[] {
  return Array.from(frequencies.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Calculate reading time estimate based on word count
 * Average reading speed: 200-250 words per minute
 */
export function estimateReadingTime(wordCount: number): number {
  const WORDS_PER_MINUTE = 225;
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}
