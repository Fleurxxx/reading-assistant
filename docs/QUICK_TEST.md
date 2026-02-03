# 快速测试指南

本指南提供了构建后快速测试英语阅读助手扩展的方法。

## 前置条件

1. 构建扩展：
   ```bash
   npm install
   npm run build
   ```

2. 在 Chrome 中加载扩展：
   - 访问 `chrome://extensions`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `dist` 文件夹

## 快速测试清单（5 分钟）

### 1. 基本功能测试

**测试网站**: https://www.wikipedia.org

1. ✅ 访问任何维基百科文章
2. ✅ 等待 3-5 秒完成分析
3. ✅ 点击扩展图标 - 验证统计显示单词数
4. ✅ 在页面上选择任何单词或短语
5. ✅ 验证侧边栏打开并显示翻译（需要在设置中配置 API 密钥）

**预期结果**：
- 扩展图标显示活动状态
- 弹窗中显示单词数
- 文本选择触发侧边栏
- 控制台无错误

### 2. 设置测试

1. ✅ 右键点击扩展图标 → 选项
2. ✅ 验证设置页面打开
3. ✅ 切换"自动分析"开关
4. ✅ 更改主题（浅色/深色/自动）
5. ✅ 将域名添加到黑名单（如 `example.com`）
6. ✅ 点击"保存设置"

**预期结果**：
- 设置成功保存
- 显示成功消息
- 主题立即更改

### 3. 翻译测试（需要 API 密钥）

**首先设置**：在设置中添加有道 API 凭据

1. ✅ 访问任何英文文章
2. ✅ 选择文本："Hello world"
3. ✅ 右键 → "翻译 'Hello world'"
4. ✅ 验证侧边栏显示中文翻译

**替代方案**（无 API 密钥）：
- 使用键盘快捷键：`Ctrl+Shift+T`（Windows）或 `Cmd+Shift+T`（Mac）
- 应该看到关于缺少凭据的错误消息

### 4. 词汇测试

1. ✅ 翻译任何单词
2. ✅ 在侧边栏中点击"添加到词汇表"
3. ✅ 打开弹窗 → 导航到词汇部分
4. ✅ 验证单词出现在列表中
5. ✅ 删除该单词

**预期结果**：
- 单词成功保存
- 出现在词汇列表中
- 可以被删除

### 5. 性能测试

**测试网站**: https://en.wikipedia.org/wiki/History_of_the_United_States

1. ✅ 打开文章（长内容）
2. ✅ 打开浏览器控制台（F12）
3. ✅ 查找性能日志
4. ✅ 检查文本提取时间 < 100ms
5. ✅ 内存使用合理（< 50MB）

**检查控制台**：
```javascript
// 在控制台中运行
window.eraTest?.debugExtensionState();
```

## 自动化测试套件

在浏览器控制台中运行综合测试：

```javascript
// 加载任何启用扩展的页面
// 打开控制台（F12）并运行：

await window.eraTest?.runAllTests();
```

**预期输出**：
```
=== 运行扩展测试 ===

[测试] 通过: 文本提取 (45ms)
[测试] 通过: 文本处理 (120ms)
[测试] 通过: 数据库操作 (35ms)
[测试] 通过: 翻译缓存 (25ms)
[测试] 通过: 压力测试: 大文本 (850ms)
[测试] 通过: 压力测试: 数据库插入 (450ms)

=== 性能摘要 ===
[性能指标表]

[测试摘要]
总计: 6 | 通过: 6 | 失败: 0
成功率: 100.0%
```

## 测试不同类型的网站

### 快速 3 网站测试（每个 2 分钟）

1. **新闻网站**: https://www.bbc.com/news
   - ✅ 正确提取内容
   - ✅ 排除广告/侧边栏
   - ✅ 单词计数准确

2. **技术文档**: https://developer.mozilla.org/en-US/docs/Web/JavaScript
   - ✅ 排除代码块
   - ✅ 仅分析文本
   - ✅ 计数技术术语

3. **电商网站**: https://www.amazon.com
   - ✅ 提取产品描述
   - ✅ 排除导航
   - ✅ 最小化误报

## 性能基准

运行基准测试：

```javascript
// 在控制台中
const { benchmark } = window.eraTest;

// 测试文本提取
await benchmark('文本提取', async () => {
  const { extractMainContent } = await import('./content/textExtractor');
  extractMainContent();
}, 50);

// 测试数据库查询
await benchmark('数据库查询', async () => {
  const { db } = await import('./storage/db');
  await db.words.limit(10).toArray();
}, 100);
```

**目标时间**：
- 文本提取: < 50ms 平均
- 数据库查询: < 10ms 平均
- 文本处理: < 100ms 平均

## 调试工具

### 1. 检查扩展状态

```javascript
// 在任何页面的控制台中
await window.eraTest?.debugExtensionState();
```

显示：
- 当前设置
- 数据库统计
- 性能指标
- 内存使用

### 2. 查看性能日志

```javascript
// 启用调试模式
localStorage.setItem('era_debug', 'true');

// 查看性能摘要
window.eraTest?.perfMonitor.logSummary();
```

### 3. 测试特定功能

```javascript
// 测试文本提取
await window.eraTest?.testTextExtraction();

// 测试数据库
await window.eraTest?.testDatabaseOperations();

// 测试翻译缓存
await window.eraTest?.testTranslationCache();
```

### 4. 检查数据库

1. 打开 DevTools (F12)
2. Application 选项卡
3. IndexedDB → EnglishReadingAssistantDB
4. 浏览表：
   - `words` - 单词频率数据
   - `vocabulary` - 已保存词汇
   - `translationCache` - 缓存的翻译
   - `readingStats` - 每日统计

## 常见问题与解决方案

### 问题：不显示单词数

**解决方案**：
1. 检查域名是否在黑名单中（设置）
2. 验证自动分析已启用
3. 刷新页面
4. 检查控制台错误

### 问题：翻译不工作

**解决方案**：
1. 验证 API 密钥已设置（设置 → 翻译 API）
2. 检查网络选项卡中的 API 错误
3. 尝试简单单词如"hello"

### 问题：扩展拖慢浏览器

**解决方案**：
1. 将当前网站添加到黑名单
2. 增加节流时间（目前 UI 中不可用，需要代码更改）
3. 清除旧统计数据
4. 重启浏览器

### 问题：性能测试失败

**解决方案**：
1. 关闭其他标签页
2. 在全新页面加载时运行测试
3. 清除浏览器缓存
4. 检查浏览器扩展冲突

## 冒烟测试脚本（30 秒）

快速验证一切正常：

```javascript
// 在任何英文文章页面的控制台中运行
(async () => {
  console.log('🧪 运行冒烟测试...');
  
  // 1. 检查扩展已加载
  if (!window.eraTest) {
    console.error('❌ 扩展未加载');
    return;
  }
  
  // 2. 测试文本提取
  const textTest = await window.eraTest.testTextExtraction();
  console.log(textTest ? '✅ 文本提取正常' : '❌ 文本提取失败');
  
  // 3. 测试数据库
  const dbTest = await window.eraTest.testDatabaseOperations();
  console.log(dbTest ? '✅ 数据库正常' : '❌ 数据库失败');
  
  // 4. 检查内存
  const memory = performance.memory;
  const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
  console.log(`📊 内存使用: ${usedMB} MB ${usedMB < 100 ? '✅' : '⚠️'}`);
  
  console.log('✨ 冒烟测试完成!');
})();
```

## 测试报告模板

测试后记录结果：

```markdown
## 测试报告 - [日期]

**测试人员**: [您的姓名]
**版本**: 1.0.0
**浏览器**: Chrome [版本]

### 结果
- [ ] 基本功能: 通过/失败
- [ ] 设置: 通过/失败
- [ ] 翻译: 通过/失败
- [ ] 词汇: 通过/失败
- [ ] 性能: 通过/失败

### 性能指标
- 文本提取: XXms
- 数据库查询: XXms
- 内存使用: XXMB

### 发现的问题
1. [问题描述]
2. [问题描述]

### 备注
[任何额外观察]
```

## 下一步

快速测试后：

1. ✅ 运行完整测试套件（参见 TESTING_AND_OPTIMIZATION_GUIDE.md）
2. ✅ 在所有 12 个推荐网站上测试
3. ✅ 执行压力测试
4. ✅ 监控 30 分钟会话
5. ✅ 生成完整测试报告

## 获取帮助

如果测试失败：
1. 检查浏览器控制台错误
2. 查看后台服务工作线程日志
3. 检查 IndexedDB 数据问题
4. 检查网络选项卡中的 API 失败
5. 查看 TESTING_AND_OPTIMIZATION_GUIDE.md 以获取详细故障排除
