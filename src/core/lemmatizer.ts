import nlp from "compromise";

/**
 * Lemmatizes a word to its base form using compromise.js
 * Examples: running -> run, cats -> cat, better -> good
 */
export function lemmatize(word: string): string {
  if (!word || word.length === 0) {
    return word;
  }

  try {
    const doc = nlp(word);

    // Get the root form of verbs
    if (doc.verbs().length > 0) {
      const infinitive = doc.verbs().toInfinitive().text();
      if (infinitive) return infinitive.toLowerCase();
    }

    // Get singular form of nouns
    if (doc.nouns().length > 0) {
      const singular = doc.nouns().toSingular().text();
      if (singular) return singular.toLowerCase();
    }

    // Get base form of adjectives
    if (doc.adjectives().length > 0) {
      const base = doc.adjectives().json()[0];
      if (base?.normal) return base.normal.toLowerCase();
    }

    // Return original word if no transformation found
    return word.toLowerCase();
  } catch (error) {
    console.error("Lemmatization error:", error);
    return word.toLowerCase();
  }
}

/**
 * Batch lemmatize multiple words for efficiency
 */
export function lemmatizeBatch(words: string[]): Map<string, string> {
  const result = new Map<string, string>();

  for (const word of words) {
    if (!result.has(word)) {
      result.set(word, lemmatize(word));
    }
  }

  return result;
}

/**
 * Check if a word is likely a proper noun (capitalized)
 * Proper nouns should not be lemmatized
 */
export function isProperNoun(word: string): boolean {
  if (!word || word.length === 0) return false;

  // Check if first letter is uppercase and rest are lowercase or mixed
  return word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
}
