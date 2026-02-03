# 多语言国际化指南 (i18n Guide)

本项目已实现完整的多语言支持系统，目前支持中文和英文两种语言。

## 📁 文件结构

```
src/
├── i18n/
│   ├── index.ts              # i18n Hook 和核心逻辑
│   ├── locales/
│   │   ├── en.json          # 英文翻译（类型源）
│   │   └── zh.json          # 中文翻译
│   └── README.md            # i18n 模块说明
├── utils/
│   └── constants.ts         # 包含 language 配置
└── options/
    └── SettingsForm.tsx     # 设置页面（含语言切换）
```

## 🎯 核心功能

### 1. 翻译文件（JSON 格式）

翻译内容存储在 JSON 文件中，方便编辑和工具处理：

**`src/i18n/locales/en.json`** （英文，作为类型推导源）
```json
{
  "app": {
    "name": "English Reading Assistant",
    "description": "Enhance your English reading experience"
  },
  "settings": {
    "title": "Settings",
    "language": "Display Language"
  }
}
```

**`src/i18n/locales/zh.json`** （中文）
```json
{
  "app": {
    "name": "英语阅读助手",
    "description": "提升你的英语阅读体验"
  },
  "settings": {
    "title": "设置",
    "language": "显示语言"
  }
}
```

### 2. i18n 系统 (`src/i18n/index.ts`)

核心特点：
- **自动类型推导**：使用 `typeof enLocale` 自动从 JSON 推导类型，无需手写类型定义
- **React Hook**：提供 `useTranslation` Hook，自动响应语言切换
- **Chrome Storage**：语言设置持久化存储

```typescript
// 类型自动从 en.json 推导
export type Translations = typeof enLocale;

// 使用示例
const { t, language, setLanguage } = useTranslation();
console.log(t.settings.title); // "Settings" 或 "设置"
```

### 3. useTranslation Hook

在任何 React 组件中使用：

```typescript
import { useTranslation } from "../i18n";

function MyComponent() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div>
      <h1>{t.app.name}</h1>
      <p>{t.app.description}</p>
      <button onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
        切换语言 / Switch Language
      </button>
    </div>
  );
}
```

**返回值：**
- `t`: 当前语言的翻译对象，具有完整的类型提示
- `language`: 当前语言（"zh" | "en"）
- `setLanguage`: 切换语言的函数

## 📝 添加新翻译的步骤

### 1. 更新 JSON 文件

**重要：先更新 `en.json`（类型源）**

```json
// src/i18n/locales/en.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "Feature description"
  }
}
```

然后更新 `zh.json`：

```json
// src/i18n/locales/zh.json
{
  "newFeature": {
    "title": "新功能",
    "description": "功能描述"
  }
}
```

### 2. 在组件中使用

TypeScript 会自动识别新添加的翻译键，提供代码补全：

```typescript
function NewFeature() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t.newFeature.title}</h2>
      <p>{t.newFeature.description}</p>
    </div>
  );
}
```

## 🔧 语言切换功能

### 在设置页面切换

`SettingsForm.tsx` 中已实现语言选择器：

```typescript
<select
  value={language}
  onChange={(e) => setLanguage(e.target.value as Language)}
>
  <option value="zh">中文</option>
  <option value="en">English</option>
</select>
```

### 编程方式切换

```typescript
import { setCurrentLanguage } from "../i18n";

// 切换到中文
await setCurrentLanguage("zh");

// 切换到英文
await setCurrentLanguage("en");
```

## 💡 最佳实践

### 1. 翻译键命名规范

使用 **camelCase** 命名，按功能模块分组：

```json
{
  "settings": { ... },
  "vocabulary": { ... },
  "translation": { ... },
  "stats": { ... }
}
```

### 2. 保持结构一致

确保 `en.json` 和 `zh.json` 的键结构完全一致：

```json
// ✅ 正确
// en.json
{ "user": { "name": "Name", "age": "Age" } }
// zh.json
{ "user": { "name": "姓名", "age": "年龄" } }

// ❌ 错误 - 结构不一致
// en.json
{ "user": { "name": "Name" } }
// zh.json
{ "user": { "fullName": "姓名" } }
```

### 3. 动态内容处理

对于需要插值的文本，使用模板字符串：

```typescript
// 翻译文件
{
  "welcome": "Welcome, {name}!"
}

// 组件中
const welcomeMsg = t.welcome.replace("{name}", userName);
```

或者分成多个部分：

```json
{
  "welcome": {
    "prefix": "Welcome, ",
    "suffix": "!"
  }
}
```

```typescript
<span>{t.welcome.prefix}{userName}{t.welcome.suffix}</span>
```

### 4. 使用有意义的分组

按功能模块组织翻译：

```json
{
  "settings": {
    "title": "Settings",
    "general": { ... },
    "appearance": { ... },
    "advanced": { ... }
  },
  "vocabulary": {
    "title": "Vocabulary",
    "filters": { ... },
    "actions": { ... }
  }
}
```

## 🚀 类型安全的优势

得益于 TypeScript 的类型推导，你可以享受：

1. **智能补全**：输入 `t.` 后自动显示所有可用的翻译键
2. **错误检查**：使用不存在的键时立即提示错误
3. **重构安全**：重命名键时可以全局查找替换

```typescript
const { t } = useTranslation();

// ✅ TypeScript 知道这些键存在
t.settings.title
t.vocabulary.searchPlaceholder

// ❌ TypeScript 会报错：属性不存在
t.nonExistent.key
```

## 📦 已支持的模块

当前已实现国际化的模块：

- ✅ 设置页面 (`SettingsForm.tsx`)
- ✅ 侧边栏 (`App.tsx`)
- ✅ 翻译视图 (`TranslationView.tsx`)
- ✅ 词汇表 (`VocabularyList.tsx`)
- ✅ 单词卡片 (`WordCard.tsx`)
- ✅ 统计页面 (`StatsView.tsx`)

## 🔍 调试技巧

### 查看当前语言

```typescript
const { language } = useTranslation();
console.log("Current language:", language);
```

### 检查翻译内容

```typescript
import { getTranslations } from "../i18n";

const zhTranslations = getTranslations("zh");
console.log(zhTranslations.settings.title); // "设置"
```

### Chrome DevTools

语言设置存储在 Chrome Storage 中，可以在 DevTools 中查看：

```javascript
// 在控制台运行
chrome.storage.local.get("settings", (result) => {
  console.log("Settings:", result.settings);
  console.log("Language:", result.settings?.language);
});
```

## 🎨 实际例子

完整的组件示例：

```typescript
import { useTranslation } from "../i18n";

function VocabularyCard() {
  const { t, language } = useTranslation();

  return (
    <div className="card">
      <h2>{t.vocabulary.title}</h2>
      <input 
        placeholder={t.vocabulary.searchPlaceholder}
        aria-label={t.vocabulary.searchLabel}
      />
      <button>{t.vocabulary.addWord}</button>
      <p className="text-sm text-gray-500">
        {language === "zh" ? "共" : "Total"} 42 
        {language === "zh" ? "个单词" : "words"}
      </p>
    </div>
  );
}
```

## 📚 相关文档

- **[QUICK_START_I18N.md](./QUICK_START_I18N.md)** - 5分钟快速上手指南
- **[src/i18n/README.md](../src/i18n/README.md)** - i18n 模块技术文档

---

**最后更新**: 2026-02-02  
**维护者**: 开发团队
