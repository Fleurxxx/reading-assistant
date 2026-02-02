# 内容脚本 - 文本提取与单词分析

本目录包含英语阅读助手扩展的内容脚本实现。内容脚本在每个网页上运行，处理文本提取、单词频率分析和文本选择翻译。

## 架构

```
content/
├── index.tsx              # 主入口和协调
├── textExtractor.ts       # 页面文本提取逻辑
├── selectionHandler.ts    # 文本选择和翻译触发
└── content.css           # UI 元素的最小样式
```

## 核心组件

### 1. 文本提取器 (`textExtractor.ts`)

从网页提取可见文本内容，并进行智能过滤：

**功能特性：**
- 排除非内容元素（脚本、样式、导航等）
- 过滤隐藏元素（display: none, visibility: hidden）
- 忽略代码块（可配置）
- 优先处理主要内容区域（article、main 标签）
- 使用 MutationObserver 处理动态内容

**关键函数：**
- `extractPageText()` - 从页面提取所有可见文本
- `extractMainContent()` - 智能提取，专注于主要内容
- `ContentObserver` - 监视 DOM 变化（用于 SPA）
- `shouldAnalyzePage()` - 检查域名白名单/黑名单

**性能：**
- 防抖提取（默认 200ms）
- 节流分析（运行间隔 5 秒）
- 高效的 DOM 遍历
- 视口感知提取

### 2. 选择处理器 (`selectionHandler.ts`)

处理文本选择事件并触发翻译：

**功能特性：**
- 鼠标选择检测
- 键盘选择支持
- 上下文菜单集成
- 自动打开侧边栏
- 选择验证（长度、内容类型）

**关键函数：**
- `handleSelection()` - 处理文本选择
- `getSelectionContext()` - 提取周围上下文
- `openSidePanel()` - 打开翻译面板

**配置：**
- 最小选择长度：1 个字符
- 最大选择长度：500 个字符
- 排除输入字段和可编辑元素

### 3. 主内容脚本 (`index.tsx`)

协调所有内容脚本功能：

**职责：**
- 初始化文本提取和分析
- 与后台脚本协调
- 将分析结果存储在 IndexedDB
- 更新每日统计
- 处理设置和偏好

**工作流程：**
1. 检查是否应该分析页面（域名白名单/黑名单）
2. 从页面提取文本内容
3. 使用 `textProcessor` 分析文本
4. 将单词频率存储在数据库中
5. 更新每日阅读统计
6. 监视动态内容变化的 DOM

## 数据流

```
页面加载
    ↓
检查设置 (shouldAnalyzePage)
    ↓
提取文本 (extractMainContent)
    ↓
分析文本 (analyzeText)
    ↓
存储结果 (IndexedDB)
    ↓
更新统计 (readingStats)
    ↓
监视变化 (ContentObserver)
```

## 文本选择流程

```
用户选择文本
    ↓
SelectionHandler.handleSelection()
    ↓
验证选择
    ↓
发送到后台 (TRANSLATE_TEXT)
    ↓
打开侧边栏
    ↓
显示翻译
```

## 与核心模块集成

### 文本处理管道

```typescript
extractMainContent()  // 获取原始文本
    ↓
cleanText()          // 规范化空白和标点
    ↓
tokenize()           // 拆分为单词
    ↓
shouldCountWord()    // 过滤停用词
    ↓
lemmatize()          // 获取基本形式 (running → run)
    ↓
analyzeText()        // 生成频率图
```

### 存储集成

内容脚本通过存储层与 IndexedDB 交互：

- **Words 表**：存储所有页面的单词频率
- **Reading Stats**：每日统计（阅读单词数、访问域名）
- **Translation Cache**：缓存翻译（由后台管理）

## 性能优化

1. **防抖**：文本提取防抖至 200ms
2. **节流**：分析节流至每 5 秒一次
3. **批量操作**：数据库操作的批量插入/更新
4. **智能过滤**：非内容元素的早期过滤
5. **增量更新**：将新频率与现有数据合并

## 设置和配置

内容脚本遵循用户设置：

- `autoAnalysis`：启用/禁用自动单词计数
- `blacklistDomains`：从分析中排除的域名
- `whitelistDomains`：仅分析这些域名（如果设置）
- `enableShortcuts`：翻译的键盘快捷键

## 错误处理

- 分析失败时优雅降级
- 未找到主要内容时回退到完整页面提取
- 用于调试的控制台日志（前缀 `[英语阅读助手]`）
- 所有异步操作周围的 try-catch 块

## 浏览器兼容性

- Chrome/Chromium：完全支持（Manifest V3）
- Edge：完全支持
- Firefox：部分支持（需要 Manifest V2 适配）
- Safari：不支持（不同的扩展 API）

## 测试建议

在各种页面类型上测试：

1. **静态页面**：新闻文章、博客
2. **SPA**：React/Vue/Angular 应用
3. **动态内容**：无限滚动、延迟加载
4. **复杂布局**：多列、侧边栏
5. **边缘情况**：空页面、代码文档、PDF

## 已知限制

1. **代码文档**：默认排除代码块
2. **PDF**：有限支持（需要 PDF.js 集成）
3. **Canvas/SVG 文本**：不提取
4. **Shadow DOM**：有限支持
5. **iFrame**：由于安全限制无法访问内容

## 未来改进

- [ ] 可配置的代码块分析
- [ ] PDF 文本提取支持
- [ ] Shadow DOM 支持
- [ ] 阅读进度追踪
- [ ] 在页面上突出显示困难单词
- [ ] 单词难度分类（CEFR 级别）
- [ ] 短语检测和分析
- [ ] 每个域名的阅读速度估计

## 调试

启用调试日志：

```javascript
// 在浏览器控制台中
localStorage.setItem('era_debug', 'true');
```

检查内容脚本状态：

```javascript
// 在浏览器控制台中
chrome.runtime.sendMessage({ type: 'GET_CONTENT_STATUS' });
```

## API 参考

### ContentObserver

```typescript
class ContentObserver {
  constructor(callback: () => void, debounceMs?: number)
  start(): void
  stop(): void
}
```

### SelectionHandler

```typescript
class SelectionHandler {
  enable(): void
  disable(): void
  setMinLength(length: number): void
  setMaxLength(length: number): void
}
```

### 文本提取

```typescript
function extractPageText(): string
function extractMainContent(): string
function getPageMetadata(): PageMetadata
function shouldAnalyzePage(): Promise<boolean>
```

## 贡献

修改内容脚本时：

1. 在多个网站上测试
2. 检查性能影响（使用 Chrome DevTools 性能选项卡）
3. 确保不与页面样式/脚本冲突
4. 如果添加新功能，请更新此 README
5. 为所有异步操作添加错误处理
