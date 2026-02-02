# 组件 (Components)

本目录包含扩展中使用的共享 UI 组件。

## VocabularyList（词汇列表）

用于显示和管理已保存词汇的综合组件。

### 功能特性

- **搜索**：跨单词和翻译的全文搜索
- **筛选**：
  - 按掌握状态筛选（全部、学习中、已掌握）
  - 按标签筛选（多选）
- **排序**：按添加日期或字母顺序排序
- **统计**：查看总单词数、已掌握数和学习中的单词数
- **导出**：将词汇导出为 CSV 格式
- **响应式**：针对侧边栏显示进行优化

### 使用方法

```tsx
import VocabularyList from '../components/VocabularyList';

function MyComponent() {
  const handleWordSelect = (vocab: Vocabulary) => {
    // 处理单词选择
    console.log('选中的单词:', vocab.word);
  };

  return <VocabularyList onWordSelect={handleWordSelect} />;
}
```

### 属性

- `onWordSelect?: (word: Vocabulary) => void` - 单词被点击时的回调

## WordCard（单词卡片）

用于显示单个词汇条目的可重用卡片组件。

### 功能特性

- **显示**：显示单词、翻译、发音和例句
- **语音**：使用 Web Speech API 播放发音
- **掌握切换**：将单词标记为已掌握或学习中
- **标签管理**：添加、编辑和删除标签
- **删除**：从词汇表中删除单词
- **可展开**：显示/隐藏例句

### 使用方法

```tsx
import WordCard from './WordCard';

function MyComponent({ vocabulary }: { vocabulary: Vocabulary }) {
  const handleUpdate = () => {
    // 刷新词汇列表
    console.log('单词已更新');
  };

  const handleDelete = () => {
    // 处理删除
    console.log('单词已删除');
  };

  return (
    <WordCard
      vocabulary={vocabulary}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onClick={() => console.log('单词被点击')}
    />
  );
}
```

### 属性

- `vocabulary: Vocabulary` - 要显示的词汇条目
- `onUpdate?: () => void` - 单词更新时的回调
- `onDelete?: () => void` - 单词删除时的回调
- `onClick?: () => void` - 单词点击时的回调

## 标签管理

`VocabularyList` 和 `WordCard` 都支持标签管理：

1. **查看标签**：标签显示为彩色徽章
2. **按标签筛选**：在 VocabularyList 中，点击筛选部分的标签
3. **添加标签**：在 WordCard 中，点击编辑图标并输入新标签
4. **删除标签**：在编辑模式下，点击标签上的 X 按钮

## 导出为 CSV

`VocabularyList` 组件提供 CSV 导出功能：

- 点击标题栏中的"导出"按钮
- 下载格式为 `vocabulary_YYYY-MM-DD.csv` 的 CSV 文件
- 包括：单词、翻译、掌握状态、标签、添加日期、例句

### CSV 格式

```csv
单词,翻译,已掌握,标签,添加日期,例句
"hello","你好","是","问候; 基础","2024-01-01","Hello, how are you? | Hello world!"
```

## 掌握度追踪

单词可以标记为：

- **学习中**（默认）：您正在学习的单词
- **已掌握**：您已掌握的单词

通过点击任何单词卡片上的圆圈/勾选图标来切换掌握状态。

## 样式

所有组件都使用 Tailwind CSS 并支持深色模式。自定义动画在 `sidepanel.css` 中定义：

- `animate-slide-in`：平滑入场动画
- `animate-audio-pulse`：音频播放指示器
- `line-clamp-2`：文本截断实用类

## 可访问性

- 支持键盘导航
- 交互元素上的 ARIA 标签
- 所有按钮上的焦点指示器
- 语义化 HTML 结构
