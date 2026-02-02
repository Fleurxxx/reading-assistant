// chrome.runtime 消息传递的消息类型
export enum MessageType {
  // 内容脚本到后台
  EXTRACT_TEXT = "EXTRACT_TEXT",
  TRANSLATE_TEXT = "TRANSLATE_TEXT",
  SAVE_VOCABULARY = "SAVE_VOCABULARY",

  // 后台到侧边栏
  TRANSLATION_RESULT = "TRANSLATION_RESULT",
  TRANSLATION_ERROR = "TRANSLATION_ERROR",

  // 设置
  UPDATE_SETTINGS = "UPDATE_SETTINGS",
  GET_SETTINGS = "GET_SETTINGS",

  // 面板和 UI 控制
  OPEN_SIDE_PANEL = "OPEN_SIDE_PANEL",
  GET_SELECTION = "GET_SELECTION",

  // 数据更新
  BATCH_WORD_UPDATE = "BATCH_WORD_UPDATE",

  // 分析控制
  REFRESH_ANALYSIS = "REFRESH_ANALYSIS",
  STOP_ANALYSIS = "STOP_ANALYSIS",
  START_ANALYSIS = "START_ANALYSIS",
}

export interface Message<T = any> {
  type: MessageType;
  data: T;
}

// 类型安全的消息发送器
export function sendMessage<T = any>(message: Message<T>): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// 使用类型安全监听消息
export function addMessageListener(
  callback: (message: Message, sender: chrome.runtime.MessageSender) => Promise<any> | any
) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Promise.resolve(callback(message, sender))
      .then(sendResponse)
      .catch((error) => {
        console.error("消息处理器错误:", error);
        sendResponse({ error: error.message });
      });
    return true; // 为异步响应保持通道打开
  });
}
