import Dexie, { type Table } from "dexie";

// 数据库接口
export interface Word {
  word: string; // 主键
  count: number;
  lastSeen: Date;
  domains: string[];
  lemma: string;
  difficulty?: string; // A1-C2 CEFR 级别
}

export interface Vocabulary {
  id?: number; // 自动递增
  word: string;
  translation: string;
  examples: string[];
  addedAt: Date;
  mastered: boolean;
  tags: string[];
  pronunciation?: string;
}

export interface TranslationCache {
  text: string; // 主键
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
  date: string; // 主键 (YYYY-MM-DD)
  wordsCount: number;
  domainsVisited: string[];
  translationCount: number;
  readingTime: number; // 分钟
  uniqueWords: number;
}

// 数据库类
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

// 单例实例 - 对内容脚本和服务工作线程都安全
export const db = new AppDatabase();

// 清理过期缓存条目的辅助函数
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
