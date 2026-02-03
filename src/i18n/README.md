# i18n 国际化模块

优化后的多语言支持系统，使用 JSON 格式存储翻译，通过 TypeScript 类型推导自动生成类型。

## 📁 文件结构

```
src/i18n/
├── index.ts              # 主入口，导出 useTranslation Hook
└── locales/             # 各语言翻译文件（JSON 格式）
    ├── en.json          # 英文翻译（类型推导源）
    └── zh.json          # 中文翻译
```

## 🎯 设计优势

### 1. 使用 JSON 格式
- ✅ **无需手写类型定义** - TypeScript 自动从 `en.json` 推导类型
- ✅ **更简洁** - 纯数据文件，易于编辑
- ✅ **易于维护** - 非技术人员也能编辑翻译
- ✅ **工具友好** - 可以用翻译管理工具处理

### 2. 类型安全
```typescript
// 类型自动从 en.json 推导！
export type Translations = typeof enLocale;
```
- ✅ 编译时检查翻译键是否存在
- ✅ 自动补全和类型提示
- ✅ 确保所有语言结构一致

### 3. 清晰的模块化结构
- ✅ 独立的 `i18n` 文件夹
- ✅ 每个语言独立 JSON 文件
- ✅ 零配置，开箱即用

## 🚀 使用方法

### 在组件中使用

```typescript
import { useTranslation } from "../i18n";

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t.app.name}</h1>
      <p>{t.settings.description}</p>
    </div>
  );
}
```

### 添加新翻译

**步骤 1**: 在 `locales/en.json` 中添加

```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

**步骤 2**: 在 `locales/zh.json` 中添加

```json
{
  "newFeature": {
    "title": "新功能",
    "description": "这是一个新功能"
  }
}
```

**步骤 3**: 直接使用（类型自动更新！）

```typescript
function MyComponent() {
  const { t } = useTranslation();
  return <h2>{t.newFeature.title}</h2>; // ✅ 类型安全
}
```

### 添加新语言

**步骤 1**: 创建 `locales/ja.json`

```json
{
  "app": {
    "name": "英語読書アシスタント",
    "description": "読書設定を構成する"
  }
}
```

**步骤 2**: 在 `index.ts` 中注册

```typescript
import jaLocale from "./locales/ja.json";

export type Language = "zh" | "en" | "ja"; // 添加新语言

const locales: Record<Language, Translations> = {
  zh: zhLocale,
  en: enLocale,
  ja: jaLocale, // 注册
};
```

## 📦 API

### useTranslation()

```typescript
const { t, language, setLanguage } = useTranslation();

// t: 翻译对象，完全类型安全
console.log(t.app.name); // ✅ 自动补全

// language: 当前语言 ("zh" | "en")
console.log(language);

// setLanguage: 切换语言
setLanguage("zh");
```

### 工具函数

```typescript
import { 
  getCurrentLanguage, 
  setCurrentLanguage,
  getTranslations 
} from "../i18n";

// 获取当前语言
const lang = await getCurrentLanguage();

// 设置语言
await setCurrentLanguage("zh");

// 获取翻译对象
const translations = getTranslations("en");
```

## 🔍 类型安全示例

TypeScript 会自动检查：

```typescript
const { t } = useTranslation();

// ✅ 正确：键存在
t.app.name

// ❌ 错误：键不存在
t.nonExistent.key // TypeScript 编译错误

// ❌ 错误：结构不匹配
t.app // TypeScript 错误（app 是对象，不是字符串）

// ✅ 正确：深层嵌套也有类型
t.settings.autoAnalysis.description
```

## 🎨 JSON 格式规范

### 基本格式

```json
{
  "section": {
    "key": "value",
    "nested": {
      "key": "value"
    }
  }
}
```

### 命名规范

- **驼峰命名**: `autoAnalysis`, `saveSuccess`
- **语义化**: 使用描述性的键名
- **分组**: 相关翻译放在一起

### 结构规范

- **一致性**: 所有语言文件必须有相同的键结构
- **嵌套**: 建议最多 3 层嵌套
- **字符串值**: 所有叶子节点都是字符串

## 💡 最佳实践

### 1. 保持同步

确保所有语言文件有相同的键：

```json
// ✅ 正确：所有语言都有相同的键
// en.json
{ "app": { "name": "App" } }

// zh.json  
{ "app": { "name": "应用" } }

// ❌ 错误：键不一致
// en.json
{ "app": { "name": "App", "version": "1.0" } }

// zh.json
{ "app": { "name": "应用" } } // 缺少 version
```

### 2. 使用 en.json 作为源

- `en.json` 是类型推导的源文件
- 先更新 `en.json`，再同步其他语言
- TypeScript 会自动检查其他语言是否完整

### 3. 格式化 JSON

使用工具格式化 JSON 文件：

```bash
# 使用 Prettier
npx prettier --write "src/i18n/locales/*.json"
```

### 4. 验证 JSON

确保 JSON 格式正确：

```bash
# 使用 jsonlint
npx jsonlint src/i18n/locales/zh.json
```

## 🔄 从 TypeScript 迁移到 JSON

如果你有旧的 `.ts` 翻译文件：

```typescript
// 旧方式：en.ts
export const en: Translations = {
  app: { name: "App" }
};

// 新方式：en.json
{
  "app": { "name": "App" }
}
```

只需：
1. 复制对象内容到 JSON 文件
2. 删除类型注解和 export
3. 确保所有键都用双引号

## 📊 性能优化

### 构建时优化

- ✅ **Tree-shaking**: 未使用的翻译键会被移除
- ✅ **类型擦除**: 类型信息在编译后消失，不影响包大小
- ✅ **JSON 压缩**: Vite 自动压缩 JSON 文件

### 运行时优化

- ✅ **按需加载**: 只加载当前语言（未来可优化为动态导入）
- ✅ **内存占用**: JSON 解析比 JS 对象更节省内存
- ✅ **初始化快**: 无需执行代码，直接解析数据

## 🐛 常见问题

### Q: 为什么选择 JSON 而不是 TypeScript？
**A**: 
- JSON 更简洁，不需要写类型
- 非开发人员也能编辑
- 可以用翻译管理工具处理
- 类型安全通过 `typeof` 自动获得

### Q: 类型如何保证？
**A**: TypeScript 的 `typeof` 可以从 JSON 推导出完整的类型结构：
```typescript
export type Translations = typeof enLocale; // 自动推导！
```

### Q: 如何处理变量插值？
**A**: 目前翻译都是静态字符串。如需动态内容，可在组件中处理：
```typescript
const message = `${t.vocabulary.stats.total}: ${count}`;
```

### Q: JSON 不支持注释怎么办？
**A**: 可以：
1. 使用描述性的键名
2. 在旁边创建 README 说明
3. 使用 JSON5（如果需要）

### Q: 如何验证所有语言文件结构一致？
**A**: TypeScript 编译时会自动检查。如果结构不一致，会报类型错误。

## 🛠️ 开发工具

### VS Code 扩展推荐

- **i18n Ally**: JSON 翻译文件可视化编辑
- **JSON Tools**: JSON 格式化和验证
- **Error Lens**: 内联显示类型错误

### 自动化工具

```bash
# 格式化所有 JSON
npm run format:i18n

# 验证 JSON 格式
npm run validate:i18n

# 检查缺失翻译
npm run check:i18n
```

## 📈 统计信息

| 指标 | 值 |
|------|-----|
| 翻译键数量 | 100+ |
| 支持语言 | 2 (中文、英文) |
| 文件大小 | ~8KB (未压缩) |
| 嵌套层级 | 最多 3 层 |
| 类型定义行数 | **0** (自动推导!) |

## ✨ 总结

使用 JSON + TypeScript 类型推导的方案具有以下优势：

1. **零类型定义** - 完全自动推导
2. **简洁明了** - 纯数据文件
3. **类型安全** - 编译时检查
4. **易于维护** - 任何人都能编辑
5. **工具友好** - 可集成翻译管理系统

这是一个现代化、高效、易维护的 i18n 解决方案！

---

**维护者**: 开发团队  
**最后更新**: 2026-02-02
