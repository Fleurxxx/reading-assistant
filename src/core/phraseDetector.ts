/**
 * Common English phrases and phrasal verbs
 * MVP: Predefined list of common phrases
 */
export const COMMON_PHRASES = new Set([
  // Phrasal verbs
  "take off",
  "put on",
  "give up",
  "look after",
  "look for",
  "look up",
  "turn on",
  "turn off",
  "turn down",
  "turn up",
  "get up",
  "get on",
  "get off",
  "get over",
  "get along",
  "come back",
  "come in",
  "come on",
  "come up",
  "go on",
  "go out",
  "go back",
  "go through",
  "make up",
  "make out",
  "make for",
  "break down",
  "break up",
  "break out",
  "bring up",
  "bring about",
  "carry on",
  "carry out",
  "find out",
  "figure out",
  "work out",
  "set up",
  "set off",
  "set out",
  "take care of",
  "take part in",
  "take place",

  // Common expressions
  "in charge of",
  "in spite of",
  "in case of",
  "in front of",
  "in terms of",
  "on behalf of",
  "on account of",
  "on top of",
  "by means of",
  "by way of",
  "at least",
  "at most",
  "at all",
  "as well as",
  "as long as",
  "as soon as",
  "as far as",
  "according to",
  "due to",
  "thanks to",
  "instead of",
  "because of",
  "in order to",

  // Idioms
  "piece of cake",
  "break the ice",
  "hit the nail on the head",
  "once in a blue moon",
  "cost an arm and a leg",
  "the last straw",
  "under the weather",
  "call it a day",
  "cut corners",
  "get out of hand",
]);

/**
 * Detects common phrases in a text
 * Returns array of detected phrases with their positions
 */
export interface DetectedPhrase {
  phrase: string;
  startIndex: number;
  endIndex: number;
}

export function detectPhrases(text: string): DetectedPhrase[] {
  const detected: DetectedPhrase[] = [];
  const lowerText = text.toLowerCase();

  for (const phrase of COMMON_PHRASES) {
    let index = 0;
    while ((index = lowerText.indexOf(phrase, index)) !== -1) {
      detected.push({
        phrase,
        startIndex: index,
        endIndex: index + phrase.length,
      });
      index += phrase.length;
    }
  }

  // Sort by position
  return detected.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Check if a phrase exists in the text
 */
export function containsPhrase(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

/**
 * Extract n-grams (2-4 words) from text for future phrase learning
 * This can be used to identify frequently occurring phrases
 */
export function extractNGrams(words: string[], n: number = 2): string[] {
  if (words.length < n) return [];

  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(" "));
  }

  return ngrams;
}

/**
 * Get all n-grams (2, 3, and 4 word combinations)
 */
export function extractAllNGrams(words: string[]): Map<string, number> {
  const ngramCounts = new Map<string, number>();

  // Extract 2-grams, 3-grams, and 4-grams
  for (let n = 2; n <= 4; n++) {
    const ngrams = extractNGrams(words, n);
    for (const ngram of ngrams) {
      ngramCounts.set(ngram, (ngramCounts.get(ngram) || 0) + 1);
    }
  }

  return ngramCounts;
}
