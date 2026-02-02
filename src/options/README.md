# 选项页面

选项页面为英语阅读助手扩展提供了全面的设置界面。

## 功能

### 常规设置
- **自动分析**：切换访问页面上的自动文本分析
- **键盘快捷键**：启用/禁用快速翻译的键盘快捷键

### 外观
- **主题**：在浅色、深色或自动（系统偏好）之间选择
- **字体大小**：从 12px 到 20px 调整字体大小
- **侧边栏位置**：配置侧边栏是出现在左侧还是右侧

### 域名管理
- **黑名单域名**：在特定域名上禁用单词分析
- **白名单域名**：仅在特定域名上分析文本（限制模式）
- 支持通配符模式（例如 `*.google.com`）

### 翻译 API
- **有道 API 配置**：输入应用密钥和应用密钥以使用翻译服务
- 安全存储在 chrome.storage.local 中

### 高级
- **导出设置**：将当前配置保存到 JSON 文件
- **导入设置**：从先前导出的文件恢复配置
- **重置为默认**：将所有设置恢复为出厂默认值

## 文件

- `options.html` - HTML 入口点
- `index.tsx` - React 入口点
- `SettingsForm.tsx` - 包含所有配置选项的主设置组件
- `options.css` - 选项页面的自定义样式
- `README.md` - 本文档文件

## 使用

用户可以通过以下方式访问选项页面：
1. 右键单击扩展图标并选择"选项"
2. 转到 `chrome://extensions` 并点击"详细信息"→"扩展选项"

## 实现细节

### 状态管理
- 使用 React hooks 进行本地状态管理
- 将设置持久化到 `chrome.storage.local`
- 无需重新加载页面即可立即应用主题

### 验证
- 使用正则表达式模式进行域名格式验证
- 防止重复域名
- API 凭据的必填字段验证

### 用户体验
- 带自动关闭的成功/错误通知
- 保存操作期间的加载状态
- 破坏性操作的确认对话框
- 字体大小和主题更改的实时预览

## 设置架构

```typescript
interface AppSettings {
  autoAnalysis: boolean;
  blacklistDomains: string[];
  whitelistDomains: string[];
  sidePanelPosition: 'left' | 'right';
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  enableShortcuts: boolean;
}

interface APICredentials {
  appKey: string;
  appSecret: string;
}
```

## 安全性

- API 凭据安全存储在 chrome.storage.local 中
- 应用密钥字段的密码输入类型
- 错误消息或日志中不包含凭据
