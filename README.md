# 英语阅读助手浏览器扩展

一个功能强大的浏览器扩展，帮助提升英语阅读体验，提供词频分析和翻译功能。

## ✨ 主要功能

- 📊 **词频统计**：实时分析阅读文本，统计单词出现频率
- 🔍 **智能翻译**：选中单词或短语即可获取翻译
- 📚 **词汇管理**：收藏和管理生词，支持词汇本分类
- 📈 **学习统计**：追踪学习进度和词汇掌握情况
- 🎯 **短语识别**：自动识别常用短语和固定搭配
- 💾 **本地存储**：使用 IndexedDB 存储数据，支持离线使用

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建扩展

```bash
npm run build
```

构建产物将生成在 `dist` 目录中。

### 加载到浏览器

1. 打开浏览器的扩展管理页面：
   - Chrome/Edge: 访问 `chrome://extensions`
   - Firefox: 访问 `about:debugging#/runtime/this-firefox`

2. 启用"开发者模式"

3. 点击"加载已解压的扩展程序"，选择 `dist` 目录

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite + @crxjs/vite-plugin
- **样式**: Tailwind CSS
- **数据库**: Dexie (IndexedDB 封装)
- **图表**: Chart.js
- **NLP**: Compromise.js (词形还原)
- **代码规范**: Biome
- **Git Hooks**: Husky + Commitlint + Lint-staged

## 📁 项目结构

```
reading-assistant/
├── src/
│   ├── background/      # 后台脚本
│   ├── components/      # React 组件
│   ├── content/         # 内容脚本
│   ├── core/           # 核心业务逻辑
│   ├── options/        # 选项页面
│   ├── popup/          # 弹窗页面
│   ├── services/       # 服务层（翻译、缓存等）
│   ├── sidepanel/      # 侧边栏面板
│   ├── storage/        # 数据存储层
│   └── utils/          # 工具函数
├── public/             # 静态资源
└── dist/              # 构建输出
```

## 📚 开发文档

所有详细文档已移至 [`docs/`](./docs/) 目录：

- **[国际化指南](./docs/I18N_GUIDE.md)** - 多语言支持完整文档
- **[快速上手 i18n](./docs/QUICK_START_I18N.md)** - 5分钟快速入门
- **[词汇管理](./docs/VOCABULARY_MANAGEMENT.md)** - 词汇功能详细说明
- **[代码规范](./docs/CODE_STANDARDS.md)** - 代码风格和提交规范
- **[测试指南](./docs/QUICK_TEST.md)** - 功能测试指南

📖 查看完整文档列表：[docs/README.md](./docs/README.md)

## 🔧 可用脚本

```bash
# 开发模式（热重载）
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 自动修复代码问题
npm run lint:fix

# 代码格式化
npm run format

# 完整检查和修复
npm run check

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📝 提交规范

项目使用 Conventional Commits 规范：

```bash
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具链相关
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加某个很棒的功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

[MIT License](LICENSE)

## 👤 作者

Fleurxxx

## 🙏 致谢

感谢所有开源项目的贡献者！
