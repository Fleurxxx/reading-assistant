import Dexie, { type Table } from "dexie";

// Database interfaces
export interface Word {
  word: string; // primary key
  count: number;
  lastSeen: Date;
  domains: string[];
  lemma: string;
  difficulty?: string; // A1-C2 CEFR level
}

export interface Vocabulary {
  id?: number; // auto-increment
  word: string;
  translation: string;
  examples: string[];
  addedAt: Date;
  mastered: boolean;
  tags: string[];
  pronunciation?: string;
}

export interface TranslationCache {
  text: string; // primary key
  result: TranslationResult;
  cachedAt: Date;
  expiresAt: Date;
}

export interface TranslationResult {
  translation: string;
  phonetic?: string;
  explains?: string[];
  examples?: string[];
  webTranslations?: { key: string; value: string[] }[];
}

export interface ReadingStats {
  date: string; // primary key (YYYY-MM-DD)
  wordsCount: number;
  domainsVisited: string[];
  translationCount: number;
  readingTime: number; // in minutes
  uniqueWords: number;
}

// Database class
export class AppDatabase extends Dexie {
  words!: Table<Word, string>;
  vocabulary!: Table<Vocabulary, number>;
  translationCache!: Table<TranslationCache, string>;
  readingStats!: Table<ReadingStats, string>;

  constructor() {
    super("EnglishReadingAssistantDB");

    this.version(1).stores({
      words: "word, lastSeen, count",
      vocabulary: "++id, word, addedAt, mastered",
      translationCache: "text, expiresAt",
      readingStats: "date",
    });
  }
}

// Singleton instance - safe for both content scripts and service workers
export const db = new AppDatabase();

// Helper to clean expired cache entries
export async function cleanExpiredCache(): Promise<number> {
  const now = new Date();
  const expired = await db.translationCache.where("expiresAt").below(now).toArray();

  if (expired.length > 0) {
    await db.translationCache.bulkDelete(expired.map((e) => e.text));
  }

  return expired.length;
}

// Helper to get today's date string
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}
