import { translateText } from "../services/translationService";
import { db, getTodayDateString } from "../storage/db";
import { MessageType } from "../utils/messaging";

/**
 * 后台服务工作线程的消息处理器
 * 处理来自内容脚本和扩展其他部分的所有传入消息
 */
export class MessageHandler {
  /**
   * 处理翻译请求
   */
  async handleTranslation(
    data: { text: string; context?: string },
    _sender: chrome.runtime.MessageSender
  ): Promise<any> {
    try {
      console.log("[消息处理器] 翻译请求:", data.text);

      // 验证输入
      if (!data.text || data.text.length === 0) {
        throw new Error("提供的文本为空");
      }

      if (data.text.length > 5000) {
        throw new Error("文本过长（最多 5000 字符）");
      }

      // 翻译文本
      const result = await translateText(data.text);

      // 更新每日统计中的翻译次数
      await this.incrementTranslationCount();

      // 将结果发送到侧边栏
      await this.sendToSidePanel({
        type: MessageType.TRANSLATION_RESULT,
        data: {
          text: data.text,
          result,
          context: data.context,
        },
      });

      return { success: true, result };
    } catch (error: any) {
      console.error("[消息处理器] 翻译错误:", error);

      // 将错误发送到侧边栏
      await this.sendToSidePanel({
        type: MessageType.TRANSLATION_ERROR,
        data: {
          text: data.text,
          error: error.message || "翻译失败",
        },
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * 处理来自内容脚本的文本提取通知
   */
  async handleTextExtraction(data: {
    totalWords: number;
    uniqueWords: number;
    domain: string;
    url: string;
  }): Promise<any> {
    try {
      console.log("[消息处理器] 文本提取:", data);

      // 更新阅读统计
      const today = getTodayDateString();
      const existing = await db.readingStats.get(today);

      if (existing) {
        // 更新现有统计
        const domainsSet = new Set(existing.domainsVisited);
        domainsSet.add(data.domain);

        await db.readingStats.update(today, {
          wordsCount: existing.wordsCount + data.totalWords,
          uniqueWords: Math.max(existing.uniqueWords, data.uniqueWords),
          domainsVisited: Array.from(domainsSet),
        });
      } else {
        // 创建新的统计条目
        await db.readingStats.add({
          date: today,
          wordsCount: data.totalWords,
          uniqueWords: data.uniqueWords,
          domainsVisited: [data.domain],
          translationCount: 0,
          readingTime: 0,
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error("[消息处理器] 文本提取错误:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理保存词汇请求
   */
  async handleSaveVocabulary(data: {
    word: string;
    translation: string;
    examples?: string[];
    pronunciation?: string;
  }): Promise<any> {
    try {
      console.log("[消息处理器] 保存词汇:", data.word);

      // 验证输入
      if (!data.word || !data.translation) {
        throw new Error("单词和翻译是必需的");
      }

      const normalizedWord = data.word.toLowerCase().trim();

      // 检查单词是否已存在
      const existing = await db.vocabulary.where("word").equals(normalizedWord).first();

      if (existing) {
        return {
          success: false,
          error: "单词已在词汇表中",
          duplicate: true,
        };
      }

      // 添加到词汇表
      const id = await db.vocabulary.add({
        word: normalizedWord,
        translation: data.translation,
        examples: data.examples || [],
        pronunciation: data.pronunciation,
        addedAt: new Date(),
        mastered: false,
        tags: [],
      });

      return { success: true, id };
    } catch (error: any) {
      console.error("[消息处理器] 保存词汇错误:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理获取设置请求
   */
  async handleGetSettings(): Promise<any> {
    try {
      const result = await chrome.storage.local.get(["era_settings", "era_api_credentials"]);

      return {
        success: true,
        settings: result.era_settings,
        credentials: result.era_api_credentials,
      };
    } catch (error: any) {
      console.error("[消息处理器] 获取设置错误:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理更新设置请求
   */
  async handleUpdateSettings(settings: any): Promise<any> {
    try {
      await chrome.storage.local.set({ era_settings: settings });

      // 向所有标签页广播设置更新
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: "SETTINGS_UPDATED",
              data: settings,
            });
          } catch (_error) {
            // 标签页可能没有注入内容脚本
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("[消息处理器] 更新设置错误:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理打开侧边栏请求
   */
  async handleOpenSidePanel(sender: chrome.runtime.MessageSender): Promise<any> {
    try {
      if (sender.tab?.id) {
        await chrome.sidePanel.open({ tabId: sender.tab.id });
      } else if (sender.tab?.windowId) {
        await chrome.sidePanel.open({ windowId: sender.tab.windowId });
      } else {
        // 后备：在当前窗口打开
        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (currentTab?.windowId) {
          await chrome.sidePanel.open({ windowId: currentTab.windowId });
        }
      }
      return { success: true };
    } catch (error: any) {
      console.error("[消息处理器] 打开侧边栏错误:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理获取选择请求（来自键盘快捷键）
   */
  async handleGetSelection(sender: chrome.runtime.MessageSender): Promise<any> {
    try {
      if (!sender.tab?.id) {
        return { success: false, error: "没有活动标签页" };
      }

      // 向内容脚本发送消息以获取当前选择
      const response = await chrome.tabs.sendMessage(sender.tab.id, {
        type: "GET_SELECTION",
      });

      if (response?.text) {
        // 将选择作为翻译请求处理
        return await this.handleTranslation(
          { text: response.text, context: response.context },
          sender
        );
      }

      return { success: false, error: "未选择文本" };
    } catch (error: any) {
      console.error("[消息处理器] 获取选择错误:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理批量单词更新
   */
  async handleBatchWordUpdate(
    words: Array<{ word: string; count: number; domain: string }>
  ): Promise<any> {
    try {
      console.log("[消息处理器] 批量单词更新:", words.length, "个单词");

      // 批量处理单词以避免阻塞
      const batchSize = 50;
      let processed = 0;

      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async ({ word, count, domain }) => {
            const existing = await db.words.get(word);

            if (existing) {
              // 更新现有单词
              const domainsSet = new Set(existing.domains);
              domainsSet.add(domain);

              await db.words.update(word, {
                count: existing.count + count,
                lastSeen: new Date(),
                domains: Array.from(domainsSet),
              });
            } else {
              // 添加新单词
              await db.words.add({
                word,
                count,
                lastSeen: new Date(),
                domains: [domain],
                lemma: word, // 如果需要，稍后由词形还原器更新
              });
            }
          })
        );

        processed += batch.length;
      }

      return { success: true, processed };
    } catch (error: any) {
      console.error("[消息处理器] 批量单词更新错误:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 向侧边栏发送消息
   */
  private async sendToSidePanel(message: any): Promise<void> {
    try {
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      // 侧边栏可能未打开，这没关系
      console.debug("[消息处理器] 侧边栏不可用:", error);
    }
  }

  /**
   * 增加每日统计中的翻译次数
   */
  private async incrementTranslationCount(): Promise<void> {
    try {
      const today = getTodayDateString();
      const existing = await db.readingStats.get(today);

      if (existing) {
        await db.readingStats.update(today, {
          translationCount: existing.translationCount + 1,
        });
      } else {
        await db.readingStats.add({
          date: today,
          wordsCount: 0,
          uniqueWords: 0,
          domainsVisited: [],
          translationCount: 1,
          readingTime: 0,
        });
      }
    } catch (error) {
      console.error("[消息处理器] 增加翻译次数错误:", error);
    }
  }
}

// 导出单例实例
export const messageHandler = new MessageHandler();
