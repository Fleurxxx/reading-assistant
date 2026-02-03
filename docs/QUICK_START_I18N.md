# 多语言功能快速开始

## 🎯 5分钟快速上手

### 用户使用

#### 切换到中文界面

1. 打开插件设置页面（点击插件图标 → 右上角齿轮图标）
2. 找到 **Appearance** / **外观** 部分
3. 在 **Display Language** / **显示语言** 下拉框中选择 **简体中文**
4. 点击 **Save Settings** / **保存设置**

✨ 界面立即切换为中文！

#### 切换回英文界面

1. 打开插件设置页面
2. 找到 **外观** 部分
3. 在 **显示语言** 下拉框中选择 **English**
4. 点击 **保存设置**

✨ 界面立即切换为英文！

---

### 开发者使用

#### 在新组件中使用多语言

```typescript
import { useTranslation } from "../i18n";

function MyNewComponent() {
  const { t, language, setLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t.app.name}</h1>
      <p>{t.settings.description}</p>
      <button>{t.actions.save}</button>
      
      {/* 切换语言按钮 */}
      <button onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
        {language === "en" ? "中文" : "English"}
      </button>
    </div>
  );
}
```

#### 添加新的翻译内容

**步骤 1**: 在 `src/i18n/locales/en.json` 中添加（英文是类型源）：

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description",
    "button": "Click Here"
  }
}
```

**步骤 2**: 在 `src/i18n/locales/zh.json` 中添加对应的中文翻译：

```json
{
  "myFeature": {
    "title": "我的功能",
    "description": "功能描述",
    "button": "点击这里"
  }
}
```

**步骤 3**: 在组件中使用（自动获得类型提示）：

```typescript
function MyFeature() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t.myFeature.title}</h2>
      <p>{t.myFeature.description}</p>
      <button>{t.myFeature.button}</button>
    </div>
  );
}
```

✨ 完成！TypeScript 会自动识别新添加的翻译键，提供智能补全。

---

## 📋 常见场景示例

### 1. 按钮文本

```typescript
<button>{t.actions.save}</button>
<button>{t.actions.cancel}</button>
<button>{t.actions.delete}</button>
```

### 2. 表单标签

```typescript
<label>{t.settings.apiKey}</label>
<label>{t.settings.apiUrl}</label>
<label>{t.settings.language}</label>
```

### 3. 占位符文本

```typescript
<input placeholder={t.vocabulary.searchPlaceholder} />
<textarea placeholder={t.notes.inputPlaceholder} />
```

### 4. 错误提示

```typescript
{error && <p className="error">{t.errors.loadFailed}</p>}
{!apiKey && <p className="warning">{t.settings.apiKeyRequired}</p>}
```

### 5. 页面标题

```typescript
<h1>{t.settings.title}</h1>
<h2>{t.vocabulary.title}</h2>
<h3>{t.stats.recentActivity}</h3>
```

---

## 💡 开发技巧

### 1. 代码补全

在输入 `t.` 后，编辑器会自动显示所有可用的翻译键：

```typescript
const { t } = useTranslation();
t. // ← 按下 . 后会显示所有可用的键
```

### 2. 类型检查

TypeScript 会在编译时检查翻译键是否存在：

```typescript
// ✅ 正确 - 键存在
t.settings.title

// ❌ 错误 - TypeScript 会报错
t.nonExistent.key
```

### 3. 快速查找所有翻译

使用 VS Code 的 "Go to Definition" 功能：
- 按住 `Cmd/Ctrl` 点击 `t.settings.title`
- 直接跳转到 `en.json` 中的定义

### 4. 批量重命名

需要重命名翻译键时：
1. 在 `en.json` 中重命名键
2. 在 `zh.json` 中同步重命名
3. 使用 VS Code 的 "Find All References" 找到所有使用该键的地方
4. 全局替换

---

## 🔧 JSON 文件编辑技巧

### 1. 保持结构一致

确保 `en.json` 和 `zh.json` 的键结构完全相同：

```json
// en.json
{
  "feature": {
    "title": "Title",
    "subtitle": "Subtitle"
  }
}

// zh.json - 结构必须相同
{
  "feature": {
    "title": "标题",
    "subtitle": "副标题"
  }
}
```

### 2. 使用 JSON 验证工具

推荐使用 VS Code 插件：
- **i18n Ally** - 可视化管理翻译文件
- **JSON Tools** - JSON 格式化和验证

### 3. 特殊字符处理

JSON 中的特殊字符需要转义：

```json
{
  "message": "Don't forget to save!",        // ✅ 单引号不需要转义
  "quote": "He said \"Hello\"",             // ✅ 双引号需要转义
  "path": "C:\\Users\\Documents",           // ✅ 反斜杠需要转义
  "newline": "Line 1\nLine 2"               // ✅ 换行符
}
```

---

## 🚀 实战案例

### 完整组件示例

```typescript
import { useTranslation } from "../i18n";
import { useState } from "react";

function SettingsPanel() {
  const { t, language, setLanguage } = useTranslation();
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // 保存逻辑...
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-panel">
      {/* 标题 */}
      <h1>{t.settings.title}</h1>
      
      {/* 语言切换 */}
      <div className="setting-item">
        <label>{t.settings.language}</label>
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value as "zh" | "en")}
        >
          <option value="zh">简体中文</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* API 配置 */}
      <div className="setting-item">
        <label>{t.settings.apiKey}</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={t.settings.apiKeyPlaceholder}
        />
        <p className="help-text">{t.settings.apiKeyHelp}</p>
      </div>

      {/* 操作按钮 */}
      <div className="actions">
        <button onClick={handleSave} className="btn-primary">
          {t.actions.save}
        </button>
        {saved && <span className="success">{t.messages.saveSuccess}</span>}
      </div>
    </div>
  );
}
```

### 对应的翻译文件

**en.json:**
```json
{
  "settings": {
    "title": "Settings",
    "language": "Display Language",
    "apiKey": "API Key",
    "apiKeyPlaceholder": "Enter your API key",
    "apiKeyHelp": "You can get an API key from the dashboard"
  },
  "actions": {
    "save": "Save Settings",
    "cancel": "Cancel"
  },
  "messages": {
    "saveSuccess": "Settings saved successfully!"
  }
}
```

**zh.json:**
```json
{
  "settings": {
    "title": "设置",
    "language": "显示语言",
    "apiKey": "API 密钥",
    "apiKeyPlaceholder": "请输入 API 密钥",
    "apiKeyHelp": "可以从控制台获取 API 密钥"
  },
  "actions": {
    "save": "保存设置",
    "cancel": "取消"
  },
  "messages": {
    "saveSuccess": "设置保存成功！"
  }
}
```

---

## 📚 更多资源

- **[I18N_GUIDE.md](./I18N_GUIDE.md)** - 完整的国际化开发指南
- **[src/i18n/README.md](../src/i18n/README.md)** - i18n 模块技术文档
- **[src/i18n/locales/](../src/i18n/locales/)** - 查看所有翻译文件

---

**最后更新**: 2026-02-02  
**维护者**: 开发团队
