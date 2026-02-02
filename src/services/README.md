# 翻译服务

本目录包含英语阅读助手扩展的完整翻译服务实现，具有有道 API 集成和复杂的双层缓存系统。

## 架构

```
services/
├── translationAdapter.ts    # 接口和错误类型
├── youdaoTranslator.ts      # 有道 API 实现
├── translationCache.ts      # 双层缓存层
├── translationService.ts    # 结合缓存和适配器的主服务
├── index.ts                 # 模块导出
├── examples.ts              # 使用示例
└── testUtils.ts             # 测试工具
```

## 核心组件

### 1. TranslationAdapter 接口 (`translationAdapter.ts`)

为翻译提供商定义灵活的接口，便于将来添加对其他服务（Google 翻译、DeepL 等）的支持。

**功能特性：**
- 任何翻译服务的标准接口
- 带错误代码的自定义错误类
- 类型安全的凭据接口
- 全面的错误代码（NO_CREDENTIALS、RATE_LIMIT 等）

### 2. 有道翻译器 (`youdaoTranslator.ts`)

有道翻译 API 的完整实现，具有企业级功能。

**功能特性：**
- ✅ API 身份验证的 SHA256 签名生成
- ✅ 带 100ms 延迟的请求队列以防止速率限制
- ✅ 从 Chrome 存储自动加载凭据
- ✅ 带映射错误代码的全面错误处理
- ✅ 支持音标、解释和网络翻译
- ✅ 文本长度验证（最多 5000 字符）
- ✅ 语言支持（默认英文到中文）

**API 错误处理：**
- 所有有道错误代码（101-401）都映射到友好消息
- 自动检测凭据问题
- 网络错误恢复
- 速率限制检测

### 3. 翻译缓存 (`translationCache.ts`)

用于最佳性能的双层缓存系统。

**功能特性：**
- ✅ **内存缓存（L1）**：LRU 缓存，100 个条目，可即时访问
- ✅ **IndexedDB 缓存（L2）**：带 30 天过期的持久缓存
- ✅ 自动缓存命中/未命中统计追踪
- ✅ 缓存规范化（小写、空白处理）
- ✅ 过期条目清理
- ✅ 常用词预加载支持
- ✅ 缓存大小估算
- ✅ 导出/导入功能

**性能：**
- 目标：>70% 缓存命中率
- 内存缓存：<1ms 访问时间
- IndexedDB 缓存：~10-20ms 访问时间
- API 调用：~500-1000ms（通过缓存避免）

### 4. 翻译服务 (`translationService.ts`)

协调适配器和缓存层的主服务。

**功能特性：**
- ✅ 缓存优先策略（检查缓存 → API → 存储缓存）
- ✅ 带自动缓存的单次翻译
- ✅ 批量翻译支持
- ✅ 缓存管理（清除、统计、清理）
- ✅ 适配器切换支持（用于未来提供商）
- ✅ 使用常用词预加载缓存
- ✅ 自动错误处理

**使用示例：**
```typescript
import { translationService } from '@/services';

// 简单翻译（缓存优先）
const result = await translationService.translate('hello');
console.log(result.translation); // "你好"

// 批量翻译
const results = await translationService.translateBatch(['apple', 'banana']);

// 获取缓存统计
const stats = await translationService.getCacheStats();
console.log(`命中率: ${stats.hitRate * 100}%`);
```

## 数据流

```
用户选择文本
    ↓
内容脚本 → 后台服务工作线程
    ↓
TranslationService.translate(text)
    ↓
检查内存缓存 (L1)
    ↓ (未命中)
检查 IndexedDB 缓存 (L2)
    ↓ (未命中)
YoudaoTranslator.translate(text)
    ↓ (带请求队列)
有道 API 调用
    ↓
存储在两个缓存中
    ↓
返回结果 → 侧边栏
```

## 配置

### 设置有道 API 凭据

```typescript
import { youdaoTranslator } from '@/services';

// 保存凭据
await youdaoTranslator.setCredentials(
  'your-app-key',
  'your-app-secret'
);

// 检查是否已配置
const isConfigured = await youdaoTranslator.isConfigured();
```

在此获取凭据：https://ai.youdao.com/

## 测试和调试

`testUtils.ts` 文件提供全面的测试工具：

```typescript
import { translationTests } from '@/services';

// 运行所有测试
await translationTests.run();

// 性能基准测试
await translationTests.benchmark();

// 查看缓存统计
await translationTests.showCache();

// 预加载常用词
await translationTests.preload();

// 清理过期条目
await translationTests.cleanup();

// 导出缓存以备份
const json = await translationTests.export();
```

## 错误处理

所有翻译错误都使用带特定错误代码的 `TranslationError` 类：

- `NO_CREDENTIALS`：未配置 API 凭据
- `INVALID_CREDENTIALS`：无效的 API 凭据
- `RATE_LIMIT`：超过 API 速率限制
- `TEXT_TOO_LONG`：文本超过 5000 字符
- `INVALID_LANGUAGE`：不支持的语言对
- `NETWORK_ERROR`：网络连接失败
- `API_ERROR`：通用 API 错误
- `UNKNOWN_ERROR`：意外错误

## 性能优化

1. **双层缓存**：内存缓存即时访问，IndexedDB 持久化
2. **请求队列**：请求间隔 100ms 以防止速率限制
3. **文本规范化**：最大化缓存命中（不区分大小写、空白处理）
4. **LRU 驱逐**：在内存中保留最近 100 个翻译
5. **批处理**：高效处理多个翻译

## 缓存统计

缓存提供详细的统计信息：

```typescript
{
  totalEntries: 245,      // 总缓存翻译
  memoryCacheSize: 100,   // 当前内存缓存大小
  hitRate: 0.78,          // 78% 缓存命中率
  hits: 156,              // 缓存命中次数
  misses: 44              // 缓存未命中次数
}
```

## 与 Chrome 扩展集成

### 后台服务工作线程
```typescript
import { setupBackgroundTranslationHandler } from '@/services/examples';

// 设置消息监听器
setupBackgroundTranslationHandler();
```

### 内容脚本
```typescript
import { MessageType, sendMessage } from '@/utils/messaging';

// 请求翻译
await sendMessage({
  type: MessageType.TRANSLATE_TEXT,
  data: { text: selectedText }
});
```

### 侧边栏
```typescript
import { addMessageListener, MessageType } from '@/utils/messaging';

// 监听翻译结果
addMessageListener((message) => {
  if (message.type === MessageType.TRANSLATION_RESULT) {
    displayTranslation(message.data);
  }
});
```

## 依赖项

- `crypto-js`：有道 API 的 SHA256 签名生成
- `dexie`：缓存持久化的 IndexedDB 包装器
- Chrome 扩展 API：`chrome.storage`、`chrome.runtime`

## 未来改进

- [ ] 支持其他翻译提供商（Google、DeepL）
- [ ] 使用本地词典进行离线翻译
- [ ] 翻译历史追踪
- [ ] 自定义短语词典
- [ ] 音频发音播放
- [ ] 翻译质量反馈

## 许可证

英语阅读助手 Chrome 扩展项目的一部分。
