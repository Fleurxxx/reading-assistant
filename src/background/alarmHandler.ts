import { cleanExpiredCache, db, getTodayDateString } from "../storage/db";
import { STATS_RETENTION_DAYS } from "../utils/constants";

/**
 * Alarm handler for periodic background tasks
 * Manages scheduled operations like cache cleanup and stats maintenance
 */
export class AlarmHandler {
  /**
   * Setup all alarms
   */
  setupAlarms(): void {
    // Daily stats reset alarm (runs at midnight)
    chrome.alarms.create("daily-reset", {
      when: this.getNextMidnight(),
      periodInMinutes: 24 * 60, // 24 hours
    });

    // Cache cleanup alarm (runs every hour)
    chrome.alarms.create("cache-cleanup", {
      periodInMinutes: 60,
    });

    // Stats cleanup alarm (runs daily to remove old stats)
    chrome.alarms.create("stats-cleanup", {
      when: this.getNextMidnight() + 60 * 60 * 1000, // 1 hour after midnight
      periodInMinutes: 24 * 60,
    });

    // Backup reminder alarm (runs weekly)
    chrome.alarms.create("backup-reminder", {
      when: this.getNextSunday(),
      periodInMinutes: 7 * 24 * 60, // 1 week
    });

    // Listen to alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    console.log("[AlarmHandler] All alarms configured");
  }

  /**
   * Handle alarm events
   */
  private async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    console.log("[AlarmHandler] Alarm triggered:", alarm.name);

    try {
      switch (alarm.name) {
        case "daily-reset":
          await this.handleDailyReset();
          break;

        case "cache-cleanup":
          await this.handleCacheCleanup();
          break;

        case "stats-cleanup":
          await this.handleStatsCleanup();
          break;

        case "backup-reminder":
          await this.handleBackupReminder();
          break;

        default:
          console.warn("[AlarmHandler] Unknown alarm:", alarm.name);
      }
    } catch (error) {
      console.error("[AlarmHandler] Error handling alarm:", alarm.name, error);
    }
  }

  /**
   * Handle daily reset
   */
  private async handleDailyReset(): Promise<void> {
    console.log("[AlarmHandler] Daily reset triggered");

    // Stats are automatically managed by date-based keys
    // This is mainly for logging and potential future functionality

    const today = getTodayDateString();
    const stats = await db.readingStats.get(today);

    if (stats) {
      console.log("[AlarmHandler] Previous day stats:", {
        words: stats.wordsCount,
        translations: stats.translationCount,
        domains: stats.domainsVisited.length,
      });
    }

    // Create today's entry if it doesn't exist
    const todayStats = await db.readingStats.get(today);
    if (!todayStats) {
      await db.readingStats.add({
        date: today,
        wordsCount: 0,
        uniqueWords: 0,
        domainsVisited: [],
        translationCount: 0,
        readingTime: 0,
      });
      console.log("[AlarmHandler] Created new stats entry for today");
    }
  }

  /**
   * Handle cache cleanup
   */
  private async handleCacheCleanup(): Promise<void> {
    try {
      const cleaned = await cleanExpiredCache();

      if (cleaned > 0) {
        console.log(`[AlarmHandler] Cleaned ${cleaned} expired cache entries`);
      }

      // Also check cache size and clean oldest entries if too large
      const cacheCount = await db.translationCache.count();
      const maxCacheSize = 1000;

      if (cacheCount > maxCacheSize) {
        const toDelete = cacheCount - maxCacheSize;
        const oldestEntries = await db.translationCache
          .orderBy("cachedAt")
          .limit(toDelete)
          .toArray();

        await db.translationCache.bulkDelete(oldestEntries.map((e) => e.text));
        console.log(
          `[AlarmHandler] Removed ${toDelete} oldest cache entries to maintain size limit`
        );
      }
    } catch (error) {
      console.error("[AlarmHandler] Cache cleanup error:", error);
    }
  }

  /**
   * Handle stats cleanup (remove old statistics)
   */
  private async handleStatsCleanup(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - STATS_RETENTION_DAYS);
      const cutoffDateString = cutoffDate.toISOString().split("T")[0];

      // Get all stats older than retention period
      const oldStats = await db.readingStats.where("date").below(cutoffDateString).toArray();

      if (oldStats.length > 0) {
        await db.readingStats.bulkDelete(oldStats.map((s) => s.date));
        console.log(
          `[AlarmHandler] Removed ${oldStats.length} old stats entries (older than ${STATS_RETENTION_DAYS} days)`
        );
      }
    } catch (error) {
      console.error("[AlarmHandler] Stats cleanup error:", error);
    }
  }

  /**
   * Handle backup reminder
   */
  private async handleBackupReminder(): Promise<void> {
    try {
      // Get vocabulary count
      const vocabCount = await db.vocabulary.count();

      if (vocabCount > 0) {
        // Show a notification reminder (if user has granted permission)
        try {
          await chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL("icons/icon128.svg"),
            title: "English Reading Assistant",
            message: `You have ${vocabCount} words in your vocabulary. Don't forget to backup your data!`,
            priority: 1,
          });

          console.log("[AlarmHandler] Backup reminder notification sent");
        } catch (error) {
          // Notifications might not be enabled
          console.debug("[AlarmHandler] Could not send notification:", error);
        }
      }
    } catch (error) {
      console.error("[AlarmHandler] Backup reminder error:", error);
    }
  }

  /**
   * Get timestamp for next midnight
   */
  private getNextMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return tomorrow.getTime();
  }

  /**
   * Get timestamp for next Sunday at noon
   */
  private getNextSunday(): number {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysUntilSunday,
      12, // noon
      0,
      0
    );
    return nextSunday.getTime();
  }

  /**
   * Clear all alarms (for cleanup)
   */
  async clearAllAlarms(): Promise<void> {
    await chrome.alarms.clearAll();
    console.log("[AlarmHandler] All alarms cleared");
  }

  /**
   * Get information about active alarms
   */
  async getAlarmInfo(): Promise<chrome.alarms.Alarm[]> {
    return await chrome.alarms.getAll();
  }
}

// Export singleton instance
export const alarmHandler = new AlarmHandler();
