# 代码规范与工具配置说明

本项目使用现代化的代码规范工具链来保证代码质量。

## 工具栈

### 1. Biome - 代码格式化和静态检查

[Biome](https://biomejs.dev/) 是一个快速、现代的代码格式化和 linter 工具。

#### 使用方式

```bash
# 检查代码问题
npm run lint

# 自动修复代码问题
npm run lint:fix

# 格式化代码
npm run format

# 检查并自动修复（包括不安全的修复）
npm run check
```

#### 配置文件

- `biome.json` - Biome 主配置文件
- `.biome-ignore` - 忽略某些文件或目录

### 2. Husky - Git Hooks 管理

[Husky](https://typicode.github.io/husky/) 用于管理 Git hooks，确保提交代码前执行必要的检查。

#### Git Hooks

项目配置了以下 hooks：

- **pre-commit**: 在提交前运行 lint-staged，检查暂存的文件
- **commit-msg**: 验证 commit message 格式

### 3. Commitlint - 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

#### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 增加测试
- `build`: 构建过程或辅助工具的变动
- `ci`: CI 配置文件和脚本的变动
- `chore`: 其他改动
- `revert`: 回滚

#### 示例

```bash
# 良好的提交信息
git commit -m "feat: 添加单词频率统计功能"
git commit -m "fix: 修复翻译服务缓存问题"
git commit -m "docs: 更新 README 安装说明"

# 错误的提交信息（会被拒绝）
git commit -m "update code"
git commit -m "修复bug"
```

### 4. Lint-staged - 暂存文件检查

只对 Git 暂存区的文件运行 linter，提高效率。

#### 配置文件

`.lintstagedrc.json` - 定义了针对不同文件类型的检查规则

## 开发流程

### 首次设置

```bash
# 安装依赖（会自动运行 prepare 脚本初始化 husky）
npm install
```

### 日常开发

1. **编写代码**

2. **格式化代码**（可选，commit 时会自动执行）
   ```bash
   npm run format
   ```

3. **检查代码问题**
   ```bash
   npm run lint
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```

   如果代码有问题或 commit message 不规范，提交会被阻止。

### 跳过 Hooks（不推荐）

在特殊情况下，可以使用 `--no-verify` 跳过 hooks：

```bash
git commit --no-verify -m "..."
```

**注意**: 只在紧急情况下使用，跳过检查可能导致代码质量问题。

## 编辑器集成

### VS Code

推荐安装以下扩展：

- [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) - Biome 官方扩展

配置 VS Code 设置（`.vscode/settings.json`）：

```json
{
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

## CI/CD 集成

可以在 CI 流程中添加以下检查：

```yaml
# 示例：GitHub Actions
- name: Lint check
  run: npm run lint

- name: Type check
  run: npm run type-check
```

## 故障排除

### Husky hooks 不工作

```bash
# 重新初始化 husky
npm run prepare

# 确保 hooks 有执行权限
chmod +x .husky/*
```

### Biome 报错

```bash
# 清除缓存
rm -rf node_modules/.cache

# 重新检查
npm run lint
```

### 提交信息总是被拒绝

确保 commit message 格式正确：
- 必须有 type（feat、fix 等）
- type 后面必须有冒号
- subject 不能为空
- 总长度不超过 100 字符

## 参考资源

- [Biome 文档](https://biomejs.dev/)
- [Husky 文档](https://typicode.github.io/husky/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)
