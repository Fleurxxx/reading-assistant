import { cleanExpiredCache, db, getTodayDateString } from "../storage/db";
import { STATS_RETENTION_DAYS } from "../utils/constants";

/**
 * 定期后台任务的定时任务处理器
 * 管理定时操作，如缓存清理和统计维护
 */
export class AlarmHandler {
  /**
   * 设置所有定时任务
   */
  setupAlarms(): void {
    // 每日统计重置定时任务（在午夜运行）
    chrome.alarms.create("daily-reset", {
      when: this.getNextMidnight(),
      periodInMinutes: 24 * 60, // 24 小时
    });

    // 缓存清理定时任务（每小时运行）
    chrome.alarms.create("cache-cleanup", {
      periodInMinutes: 60,
    });

    // 统计清理定时任务（每天运行以删除旧统计）
    chrome.alarms.create("stats-cleanup", {
      when: this.getNextMidnight() + 60 * 60 * 1000, // 午夜后 1 小时
      periodInMinutes: 24 * 60,
    });

    // 备份提醒定时任务（每周运行）
    chrome.alarms.create("backup-reminder", {
      when: this.getNextSunday(),
      periodInMinutes: 7 * 24 * 60, // 1 周
    });

    // 监听定时任务事件
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    console.log("[定时任务处理器] 所有定时任务已配置");
  }

  /**
   * 处理定时任务事件
   */
  private async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    console.log("[定时任务处理器] 定时任务触发:", alarm.name);

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
          console.warn("[定时任务处理器] 未知定时任务:", alarm.name);
      }
    } catch (error) {
      console.error("[定时任务处理器] 处理定时任务错误:", alarm.name, error);
    }
  }

  /**
   * 处理每日重置
   */
  private async handleDailyReset(): Promise<void> {
    console.log("[定时任务处理器] 每日重置已触发");

    // 统计由基于日期的键自动管理
    // 这主要用于日志记录和潜在的未来功能

    const today = getTodayDateString();
    const stats = await db.readingStats.get(today);

    if (stats) {
      console.log("[定时任务处理器] 前一天统计:", {
        words: stats.wordsCount,
        translations: stats.translationCount,
        domains: stats.domainsVisited.length,
      });
    }

    // 如果不存在，则创建今天的条目
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
      console.log("[定时任务处理器] 已为今天创建新的统计条目");
    }
  }

  /**
   * 处理缓存清理
   */
  private async handleCacheCleanup(): Promise<void> {
    try {
      const cleaned = await cleanExpiredCache();

      if (cleaned > 0) {
        console.log(`[定时任务处理器] 清理了 ${cleaned} 个过期缓存条目`);
      }

      // 同时检查缓存大小，如果太大则清理最旧的条目
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
          `[定时任务处理器] 删除了 ${toDelete} 个最旧的缓存条目以保持大小限制`
        );
      }
    } catch (error) {
      console.error("[定时任务处理器] 缓存清理错误:", error);
    }
  }

  /**
   * 处理统计清理（删除旧统计数据）
   */
  private async handleStatsCleanup(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - STATS_RETENTION_DAYS);
      const cutoffDateString = cutoffDate.toISOString().split("T")[0];

      // 获取所有早于保留期的统计
      const oldStats = await db.readingStats.where("date").below(cutoffDateString).toArray();

      if (oldStats.length > 0) {
        await db.readingStats.bulkDelete(oldStats.map((s) => s.date));
        console.log(
          `[定时任务处理器] 删除了 ${oldStats.length} 个旧统计条目（早于 ${STATS_RETENTION_DAYS} 天）`
        );
      }
    } catch (error) {
      console.error("[定时任务处理器] 统计清理错误:", error);
    }
  }

  /**
   * 处理备份提醒
   */
  private async handleBackupReminder(): Promise<void> {
    try {
      // 获取词汇数量
      const vocabCount = await db.vocabulary.count();

      if (vocabCount > 0) {
        // 显示提醒通知（如果用户已授予权限）
        try {
          await chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL("icons/icon128.svg"),
            title: "英语阅读助手",
            message: `您的词汇表中有 ${vocabCount} 个单词。别忘了备份您的数据！`,
            priority: 1,
          });

          console.log("[定时任务处理器] 备份提醒通知已发送");
        } catch (error) {
          // 通知可能未启用
          console.debug("[定时任务处理器] 无法发送通知:", error);
        }
      }
    } catch (error) {
      console.error("[定时任务处理器] 备份提醒错误:", error);
    }
  }

  /**
   * 获取下一个午夜的时间戳
   */
  private getNextMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return tomorrow.getTime();
  }

  /**
   * 获取下一个周日中午的时间戳
   */
  private getNextSunday(): number {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysUntilSunday,
      12, // 中午
      0,
      0
    );
    return nextSunday.getTime();
  }

  /**
   * 清除所有定时任务（用于清理）
   */
  async clearAllAlarms(): Promise<void> {
    await chrome.alarms.clearAll();
    console.log("[定时任务处理器] 所有定时任务已清除");
  }

  /**
   * 获取有关活动定时任务的信息
   */
  async getAlarmInfo(): Promise<chrome.alarms.Alarm[]> {
    return await chrome.alarms.getAll();
  }
}

// 导出单例实例
export const alarmHandler = new AlarmHandler();
