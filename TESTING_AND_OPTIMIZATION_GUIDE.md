# 测试与优化指南

本指南提供在多站点测试 English Reading Assistant 扩展及优化其性能的完整说明。

## 目录
1. [测试策略](#testing-strategy)
2. [测试站点](#test-sites)
3. [性能基准](#performance-benchmarks)
4. [优化技术](#optimization-techniques)
5. [常见问题](#common-issues)
6. [调试工具](#debugging-tools)

## Testing Strategy

### 1. 功能测试

#### 核心功能
- ✅ 文本抽取与分析
- ✅ 词频统计
- ✅ 文本选取与翻译
- ✅ 词汇管理
- ✅ 统计追踪
- ✅ 设置持久化

#### 用户交互
- 鼠标选中文本
- 键盘快捷键（Ctrl/Cmd + Shift + T）
- 右键菜单翻译
- 侧边栏操作
- 词汇添加/删除/搜索
- 设置配置

### 2. 兼容性测试

在不同环境测试扩展：
- **浏览器**：Chrome、Edge、Brave、Opera（基于 Chromium）
- **操作系统**：Windows、macOS、Linux
- **屏幕尺寸**：桌面（1920×1080）、笔记本（1366×768）、大屏（2560×1440）

### 3. 性能测试

需要监控的关键指标：
- 文本抽取时间
- 翻译响应时间
- 数据库查询性能
- 内存占用
- CPU 利用率

## Test Sites

### 新闻 & 文章
适合测试长文内容与词频分析。

1. **BBC News** - https://www.bbc.com/news  
   - 测试：文章页分析  
   - 期望：干净的内容抽取，正确词频  
   - 挑战：多侧边栏与广告

2. **Medium** - https://medium.com  
   - 测试：博客阅读  
   - 期望：主内容分离  
   - 挑战：付费墙、动态加载

3. **The Guardian** - https://www.theguardian.com  
   - 测试：带评论的长文  
   - 期望：排除评论区  
   - 挑战：大量 JS、懒加载图片

### 技术文档
测试代码块排除与技术词汇。

4. **MDN Web Docs** - https://developer.mozilla.org  
   - 测试：代码示例排除  
   - 期望：跳过代码块，分析说明文字  
   - 挑战：代码与正文混排

5. **Stack Overflow** - https://stackoverflow.com  
   - 测试：问答页  
   - 期望：分析文本，跳过代码片段  
   - 挑战：代码格式、用户生成内容

### 电商
测试文本量较少的页面。

6. **Amazon** - https://www.amazon.com  
   - 测试：商品页  
   - 期望：抽取商品描述  
   - 挑战：正文少、UI 元素多

### 社交 & 论坛
测试动态内容与 SPA。

7. **Reddit** - https://www.reddit.com  
   - 测试：子版块浏览  
   - 期望：处理无限滚动  
   - 挑战：DOM 快速变化、评论异步加载

8. **Twitter/X** - https://twitter.com  
   - 测试：信息流滚动  
   - 期望：抽取推文文本  
   - 挑战：高度动态、短文本

### 学术 & 研究
测试复杂词汇与长文档。

9. **Wikipedia** - https://www.wikipedia.org  
   - 测试：条目阅读  
   - 期望：全面词汇分析  
   - 挑战：目录、参考文献

10. **ArXiv** - https://arxiv.org  
    - 测试：学术论文（HTML）  
    - 期望：技术词汇跟踪  
    - 挑战：数学符号、公式

### 邮件 & 办公
在常见工作场景测试。

11. **Gmail** - https://mail.google.com  
    - 测试：邮件阅读（需在白名单）  
    - 期望：抽取正文  
    - 挑战：隐私、iframe

12. **Google Docs** - https://docs.google.com  
    - 测试：文档查看  
    - 期望：内容抽取  
    - 挑战：基于 Canvas 的渲染

## Performance Benchmarks

### 目标指标

| 操作 | 目标 | 可接受 | 较差 |
|------|------|--------|------|
| 文本抽取（1000 词） | < 50ms | < 100ms | > 200ms |
| 词频分析 | < 100ms | < 200ms | > 500ms |
| 翻译请求 | < 1s | < 2s | > 3s |
| 数据库查询（读） | < 10ms | < 50ms | > 100ms |
| 数据库写入（批量） | < 100ms | < 250ms | > 500ms |
| 侧边栏打开 | < 200ms | < 500ms | > 1s |

### 内存基准

- **基线**：< 10 MB
- **轻度使用**（1-5 页）：< 25 MB
- **重度使用**（20+ 页）：< 100 MB
- **可接受上限**：< 200 MB

### 性能测试方法

使用内置性能监控：

```javascript
// 在 content script 控制台
chrome.runtime.sendMessage({ type: 'GET_PERFORMANCE_STATS' });
```

或使用 Chrome DevTools：
1. 打开 DevTools（F12）
2. 进入 Performance 面板
3. 录制扩展使用过程
4. 分析火焰图与内存占用

## Optimization Techniques

### 1. 文本抽取优化

**问题**：复杂 DOM 页面抽取缓慢  
**解决方案**：已实现
- ✅ 对 MutationObserver 200ms 防抖
- ✅ 页面分析 5s 节流
- ✅ 元素可见性检查
- ✅ 对排除元素提前退出

**附加优化**：
```typescript
// 限制抽取深度
const MAX_DEPTH = 10;

// 批量 DOM 操作使用 DocumentFragment
const fragment = document.createDocumentFragment();

// 优先处理视口内内容
if (isInViewport(element)) {
  // 优先抽取
}
```

### 2. 数据库优化

**问题**：批量插入缓慢  
**解决方案**：
- ✅ 批量操作（每批 50 条）
- ✅ 事务打包
- ✅ 索引优化

**最佳实践**：
```typescript
// 批量操作使用事务
await db.transaction('rw', db.words, async () => {
  for (const word of words) {
    await db.words.add(word);
  }
});

// 使用 bulkAdd 代替多次 add()
await db.words.bulkAdd(words);
```

### 3. 翻译服务优化

**问题**：API 速率限制与响应慢  
**解决方案**：
- ✅ 30 天过期的缓存层
- ✅ 请求去重
- ✅ 指数退避的错误重试

**缓存命中率目标**：
- **良好**：> 70%
- **可接受**：> 50%
- **较差**：< 30%

### 4. 内存管理

**问题**：长时间会话出现内存泄漏  
**解决方案**：
- ✅ 页面卸载时清理观察器
- ✅ 定期清理缓存
- ✅ 限制内存数据结构

**监控**：
```javascript
// 检查内存占用
const memory = performance.memory;
console.log(`Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
```

### 5. 渲染优化

**问题**：UI 更新卡顿  
**解决方案**：
- ✅ React.memo 记忆化组件
- ✅ 长列表（词汇）使用虚拟滚动
- ✅ 重组件懒加载

### 6. 后台脚本效率

**问题**：后台脚本阻塞  
**解决方案**：
- ✅ 所有 I/O 使用 async/await
- ✅ 并发请求的消息排队
- ✅ 基于 Alarm 的维护调度

## Common Issues

### 问题 1：扩展拖慢网页

**症状**：页面加载变慢、滚动卡顿  
**原因**：
- MutationObserver 过于频繁
- 同步 DOM 操作
- 文本抽取未优化

**解决方案**：
1. 在设置中增加防抖时间
2. 将问题站点加入黑名单
3. 查看浏览器控制台错误

### 问题 2：高内存占用

**症状**：标签崩溃、扩展无响应  
**原因**：
- 内存中词频 Map 过大
- 事件监听未清理
- 缓存未过期

**解决方案**：
1. 运行缓存清理：`chrome.storage.local.get('era_settings')`
2. 清理旧统计数据
3. 重启浏览器重置扩展

### 问题 3：翻译无响应

**症状**：侧边栏无翻译结果  
**原因**：
- 缺少 API 凭据
- 网络问题
- API 速率超限

**解决方案**：
1. 在设置中确认 API Key
2. 在 Network 面板检查失败请求
3. 等待速率限制重置后重试

### 问题 4：词频统计为 0

**症状**：统计显示 0 词  
**原因**：
- 域名在黑名单
- 自动分析已关闭
- 页面内容未被识别

**解决方案**：
1. 检查设置 > 域名管理
2. 启用自动分析
3. 手动触发分析：右键 > Inspect > Console:
   ```javascript
   chrome.runtime.sendMessage({ type: 'REFRESH_ANALYSIS' });
   ```

## Debugging Tools

### 1. Chrome DevTools

**Service Worker 控制台：**
- 打开 `chrome://extensions`
- 开启开发者模式
- 点击 “Service Worker” 链接
- 查看后台日志

**Content Script 控制台：**
- 在任意页面打开 DevTools（F12）
- 搜索 `[English Reading Assistant]` 日志

### 2. IndexedDB Inspector

查看存储数据：
1. DevTools > Application
2. IndexedDB > EnglishReadingAssistantDB
3. 浏览表：words、vocabulary、translationCache、readingStats

### 3. 性能监控

内置性能跟踪：
```javascript
// 开启详细性能日志
localStorage.setItem('era_debug', 'true');

// 查看性能汇总
chrome.runtime.sendMessage({ type: 'GET_PERFORMANCE_SUMMARY' });
```

### 4. 网络抓包

监控翻译 API：
1. DevTools > Network
2. 过滤 “youdao”
3. 检查请求/响应时间
4. 验证返回数据

### 5. 内存分析

检查内存泄漏：
1. DevTools > Memory
2. 采集 heap snapshot
3. 使用一段时间后再采集
4. 查找 detached DOM nodes

## Automated Testing Checklist

### 发布前测试

- [ ] 构建扩展：`npm run build`
- [ ] 在 Chrome 加载未打包扩展
- [ ] 测试上述 12 个站点
- [ ] 验证翻译功能
- [ ] 检查统计准确性
- [ ] 测试词汇添加/删除
- [ ] 验证设置持久化
- [ ] 不同屏幕尺寸测试
- [ ] 30 分钟会话的内存占用
- [ ] 测试键盘快捷键
- [ ] 验证右键菜单
- [ ] 测试域名黑/白名单
- [ ] 导出词汇 CSV
- [ ] 导入/导出设置

### 性能测试

- [ ] 测量 Wikipedia 文章的抽取时间
- [ ] 测量翻译响应时间（10 次请求）
- [ ] 50 次翻译后的缓存命中率
- [ ] 1 小时会话的内存监控
- [ ] 词汇量 1000+ 的场景
- [ ] 验证数据库查询 < 50ms
- [ ] 慢网（3G 限速）测试

### 压力测试

- [ ] 开启 20+ 标签页
- [ ] 快速跳转（10 页/分钟）
- [ ] 连续文本选择（100 次）
- [ ] 长时间会话（4+ 小时）
- [ ] 超大页面（1 万+ 词）
- [ ] 确认无内存泄漏

## Test Report Template

```markdown
## 测试报告 - [日期]

### 环境
- 浏览器：Chrome 120.0.6099.109
- 系统：macOS 14.1
- 扩展版本：1.0.0

### 测试站点
| 站点 | 状态 | 备注 |
|------|------|------|
| BBC News | ✅ 通过 | - |
| Medium | ✅ 通过 | - |
| ... | | |

### 性能指标
| 操作 | 时间 | 状态 |
|------|------|------|
| 文本抽取 | 45ms | ✅ 良好 |
| 翻译 | 850ms | ✅ 良好 |
| ... | | |

### 发现的问题
1. **Reddit 内存高**：30 分钟后内存升至 150MB  
   - 严重度：中  
   - 指派给：性能优化

### 建议
- 将 Reddit 加入默认黑名单
- 加强缓存清理策略
```

## Continuous Optimization

### 定期维护

**每周：**
- 查看错误日志
- 检查平均响应时间
- 监控缓存命中率

**每月：**
- 分析用户反馈
- 进行内存分析
- 更新测试套件

**每季度：**
- 全量回归测试
- 性能基准对比
- 更新文档

## 性能使用提示（面向用户）

建议在用户文档中加入：

1. **尽量用白名单**，而非全站分析
2. 对性能较弱设备 **调高防抖时间**
3. 定期 **清理旧统计**（减小数据库）
4. **屏蔽重型站点**（如无限滚动的社交网站）
5. 每周 **重启浏览器** 释放扩展内存

## Conclusion

定期测试与优化可确保扩展：
- ✅ 在不同站点稳定运行
- ✅ 保持良好性能
- ✅ 不影响浏览体验
- ✅ 从容处理边界场景
- ✅ 能随使用量平滑扩展

发布更新前务必测试，并持续维护性能基准。 
