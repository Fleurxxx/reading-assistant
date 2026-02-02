import { db, getTodayDateString, type ReadingStats } from "./db";

export class StatsRepository {
  // Get or create today's stats
  async getTodayStats(): Promise<ReadingStats> {
    const today = getTodayDateString();
    let stats = await db.readingStats.get(today);

    if (!stats) {
      stats = {
        date: today,
        wordsCount: 0,
        domainsVisited: [],
        translationCount: 0,
        readingTime: 0,
        uniqueWords: 0,
      };
      await db.readingStats.add(stats);
    }

    return stats;
  }

  // Update today's word count
  async incrementWordCount(count: number, uniqueWords: number): Promise<void> {
    const today = getTodayDateString();
    const stats = await this.getTodayStats();

    await db.readingStats.update(today, {
      wordsCount: stats.wordsCount + count,
      uniqueWords: Math.max(stats.uniqueWords, uniqueWords),
    });
  }

  // Add domain to today's visited domains
  async addDomain(domain: string): Promise<void> {
    const today = getTodayDateString();
    const stats = await this.getTodayStats();

    if (!stats.domainsVisited.includes(domain)) {
      await db.readingStats.update(today, {
        domainsVisited: [...stats.domainsVisited, domain],
      });
    }
  }

  // Increment translation count
  async incrementTranslationCount(): Promise<void> {
    const today = getTodayDateString();
    const stats = await this.getTodayStats();

    await db.readingStats.update(today, {
      translationCount: stats.translationCount + 1,
    });
  }

  // Add reading time
  async addReadingTime(minutes: number): Promise<void> {
    const today = getTodayDateString();
    const stats = await this.getTodayStats();

    await db.readingStats.update(today, {
      readingTime: stats.readingTime + minutes,
    });
  }

  // Get stats for a specific date
  async getStatsByDate(date: string): Promise<ReadingStats | undefined> {
    return await db.readingStats.get(date);
  }

  // Get stats for last N days
  async getRecentStats(days: number = 7): Promise<ReadingStats[]> {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    const stats = await Promise.all(dates.map((date) => db.readingStats.get(date)));

    return stats.filter((s): s is ReadingStats => s !== undefined);
  }

  // Get all-time stats
  async getAllTimeStats(): Promise<{
    totalWords: number;
    totalTranslations: number;
    totalReadingTime: number;
    totalDays: number;
    uniqueDomains: number;
  }> {
    const allStats = await db.readingStats.toArray();

    const uniqueDomains = new Set<string>();
    allStats.forEach((s) => s.domainsVisited.forEach((d) => uniqueDomains.add(d)));

    return {
      totalWords: allStats.reduce((sum, s) => sum + s.wordsCount, 0),
      totalTranslations: allStats.reduce((sum, s) => sum + s.translationCount, 0),
      totalReadingTime: allStats.reduce((sum, s) => sum + s.readingTime, 0),
      totalDays: allStats.length,
      uniqueDomains: uniqueDomains.size,
    };
  }

  // Clean old stats (keep last N days)
  async cleanOldStats(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    const oldStats = await db.readingStats.where("date").below(cutoffString).toArray();

    if (oldStats.length > 0) {
      await db.readingStats.bulkDelete(oldStats.map((s) => s.date));
    }

    return oldStats.length;
  }

  // Clear all stats
  async clearAll(): Promise<void> {
    await db.readingStats.clear();
  }
}

export const statsRepository = new StatsRepository();
