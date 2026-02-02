import { db, type Word } from "./db";

export class WordRepository {
  // Add or update word frequency
  async addOrUpdateWord(word: string, lemma: string, domain: string): Promise<void> {
    const existing = await db.words.get(word);

    if (existing) {
      await db.words.update(word, {
        count: existing.count + 1,
        lastSeen: new Date(),
        domains: existing.domains.includes(domain)
          ? existing.domains
          : [...existing.domains, domain],
      });
    } else {
      await db.words.add({
        word,
        count: 1,
        lastSeen: new Date(),
        domains: [domain],
        lemma,
      });
    }
  }

  // Batch update words
  async batchUpdateWords(
    words: Map<string, { lemma: string; count: number }>,
    domain: string
  ): Promise<void> {
    const updates: Promise<void>[] = [];

    for (const [word, data] of words.entries()) {
      for (let i = 0; i < data.count; i++) {
        updates.push(this.addOrUpdateWord(word, data.lemma, domain));
      }
    }

    await Promise.all(updates);
  }

  // Get top N frequent words
  async getTopWords(limit: number = 10): Promise<Word[]> {
    return await db.words.orderBy("count").reverse().limit(limit).toArray();
  }

  // Get words by domain
  async getWordsByDomain(domain: string): Promise<Word[]> {
    const allWords = await db.words.toArray();
    return allWords.filter((w) => w.domains.includes(domain));
  }

  // Search words
  async searchWords(query: string): Promise<Word[]> {
    return await db.words.where("word").startsWithIgnoreCase(query).limit(50).toArray();
  }

  // Get word details
  async getWord(word: string): Promise<Word | undefined> {
    return await db.words.get(word);
  }

  // Get total unique words count
  async getTotalWordsCount(): Promise<number> {
    return await db.words.count();
  }

  // Clear all words (for reset functionality)
  async clearAll(): Promise<void> {
    await db.words.clear();
  }
}

export const wordRepository = new WordRepository();
