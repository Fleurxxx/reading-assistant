import { addMessageListener, MessageType } from "../utils/messaging";
import { alarmHandler } from "./alarmHandler";
import { messageHandler } from "./messageHandler";

/**
 * 后台服务工作线程
 * 协调扩展操作并处理消息
 */
class BackgroundService {
  constructor() {
    this.init();
  }

  /**
   * 初始化后台服务
   */
  private init(): void {
    console.log("[英语阅读助手] 后台服务已初始化");

    // 设置消息监听器
    this.setupMessageListeners();

    // 设置上下文菜单
    this.setupContextMenu();

    // 设置每日统计重置定时任务
    alarmHandler.setupAlarms();

    // 设置快捷键命令监听器
    this.setupCommands();

    // 设置安装和更新处理器
    this.setupInstallationHandlers();
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListeners(): void {
    addMessageListener(async (message, sender) => {
      switch (message.type) {
        case MessageType.TRANSLATE_TEXT:
          return await messageHandler.handleTranslation(message.data, sender);

        case MessageType.EXTRACT_TEXT:
          return await messageHandler.handleTextExtraction(message.data);

        case MessageType.SAVE_VOCABULARY:
          return await messageHandler.handleSaveVocabulary(message.data);

        case MessageType.GET_SETTINGS:
          return await messageHandler.handleGetSettings();

        case MessageType.UPDATE_SETTINGS:
          return await messageHandler.handleUpdateSettings(message.data);

        case MessageType.OPEN_SIDE_PANEL:
          return await messageHandler.handleOpenSidePanel(sender);

        case MessageType.GET_SELECTION:
          return await messageHandler.handleGetSelection(sender);

        case MessageType.BATCH_WORD_UPDATE:
          return await messageHandler.handleBatchWordUpdate(message.data);

        default:
          console.warn("[后台] 未知消息类型:", message.type);
          return { success: false, error: "未知消息类型" };
      }
    });
  }

  /**
   * 设置上下文菜单
   */
  private setupContextMenu(): void {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === "translate-selection" && info.selectionText && tab?.id) {
        try {
          // 通过消息处理器发送翻译请求
          const sender = { tab };
          await messageHandler.handleTranslation(
            { text: info.selectionText },
            sender as chrome.runtime.MessageSender
          );

          // 打开侧边栏
          await chrome.sidePanel.open({ tabId: tab.id });
        } catch (error) {
          console.error("[后台] 上下文菜单翻译错误:", error);
        }
      }
    });
  }

  /**
   * 设置安装和更新处理器
   */
  private setupInstallationHandlers(): void {
    chrome.runtime.onInstalled.addListener(async (details) => {
      console.log("[后台] 扩展已安装/更新:", details.reason);

      // 创建上下文菜单
      try {
        await chrome.contextMenus.create({
          id: "translate-selection",
          title: '翻译 "%s"',
          contexts: ["selection"],
        });
        console.log("[后台] 上下文菜单已创建");
      } catch (error) {
        console.error("[后台] 创建上下文菜单错误:", error);
      }

      // 处理不同的安装原因
      if (details.reason === "install") {
        await this.handleFirstInstall();
      } else if (details.reason === "update") {
        await this.handleUpdate(details.previousVersion);
      }
    });
  }

  /**
   * 处理首次安装
   */
  private async handleFirstInstall(): Promise<void> {
    console.log("[后台] 检测到首次安装");

    try {
      // 如果不存在，则设置默认设置
      const { era_settings } = await chrome.storage.local.get("era_settings");

      if (!era_settings) {
        // 在服务工作线程中内联定义默认设置以避免模块加载问题
        const DEFAULT_SETTINGS = {
          autoAnalysis: true,
          blacklistDomains: [],
          whitelistDomains: [],
          sidePanelPosition: "right" as const,
          theme: "auto" as const,
          fontSize: 14,
          enableShortcuts: true,
        };
        await chrome.storage.local.set({ era_settings: DEFAULT_SETTINGS });
        console.log("[后台] 默认设置已初始化");
      }

      // 显示欢迎通知
      try {
        await chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon128.svg"),
          title: "欢迎使用英语阅读助手！",
          message: "选择任意文本进行翻译。在设置中配置 API 密钥。",
          priority: 2,
        });
      } catch (error) {
        console.debug("[后台] 无法显示欢迎通知:", error);
      }

      // 首次安装时打开选项页面
      chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error("[后台] 首次安装时发生错误:", error);
    }
  }

  /**
   * 处理扩展更新
   */
  private async handleUpdate(previousVersion?: string): Promise<void> {
    console.log("[后台] 扩展已从版本更新:", previousVersion);

    // 如果需要，在此执行任何迁移任务
    // 例如，更新数据库架构、设置格式等。
  }

  /**
   * 设置键盘快捷键
   */
  private setupCommands(): void {
    chrome.commands.onCommand.addListener(async (command) => {
      if (command === "translate-selection") {
        try {
          // 获取活动标签页
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

          if (!tab?.id) {
            console.warn("[后台] 命令没有活动标签页");
            return;
          }

          // 向内容脚本发送消息以获取和翻译选择
          await chrome.tabs.sendMessage(tab.id, {
            type: "TRANSLATE_CURRENT_SELECTION",
          });

          // 打开侧边栏
          await chrome.sidePanel.open({ tabId: tab.id });
        } catch (error) {
          console.error("[后台] 命令错误:", error);
        }
      }
    });
  }
}

// 初始化后台服务
const backgroundService = new BackgroundService();

// 导出用于测试
export default BackgroundService;
export { backgroundService };
