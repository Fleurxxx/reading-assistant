import nlp from "compromise";

/**
 * 使用 compromise.js 将单词还原为其基本形式
 * 示例: running -> run, cats -> cat, better -> good
 */
export function lemmatize(word: string): string {
  if (!word || word.length === 0) {
    return word;
  }

  try {
    const doc = nlp(word);

    // 获取动词的原形
    if (doc.verbs().length > 0) {
      const infinitive = doc.verbs().toInfinitive().text();
      if (infinitive) return infinitive.toLowerCase();
    }

    // 获取名词的单数形式
    if (doc.nouns().length > 0) {
      const singular = doc.nouns().toSingular().text();
      if (singular) return singular.toLowerCase();
    }

    // 获取形容词的基本形式
    if (doc.adjectives().length > 0) {
      const base = doc.adjectives().json()[0];
      if (base?.normal) return base.normal.toLowerCase();
    }

    // 如果没有找到转换，返回原始单词
    return word.toLowerCase();
  } catch (error) {
    console.error("词形还原错误:", error);
    return word.toLowerCase();
  }
}

/**
 * 批量还原多个单词以提高效率
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
