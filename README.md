# Agent MD Generator

> 生成 AI Agent 配置文件的交互式 CLI 工具 | Interactive CLI tool for generating AI Agent configuration files

## 功能 | Features

- 交互式 CLI 界面，支持问答模式生成配置 | Interactive CLI with Q&A mode
- 9 种预置模板，涵盖前端、后端、全栈、测试等场景 | 9 built-in templates for frontend, backend, fullstack, testing, etc.
- **自动检测项目技术栈**，支持 Node.js/Python/Go/Rust | Auto-detect project tech stack: Node.js/Python/Go/Rust
- 支持自定义配置文件 | Support custom config files
- 技术栈信息自动注入模板 | Inject tech stack info into templates

## 安装 | Installation

```bash
# 全局安装
npm install -g agent-md-generator

# 或本地安装
npm install
```

## 使用方法 | Usage

### 交互模式 | Interactive Mode

```bash
agent-gen
```

### 指定模板 | Specify Template

```bash
agent-gen -t frontend
agent-gen -t backend
agent-gen -t docs-gen
```

### 自动检测项目配置 | Auto-detect Project Config

```bash
agent-gen -a
agent-gen -a -t docs-gen
```

### 指定输出路径 | Specify Output Path

```bash
agent-gen -t frontend -o ./agent.md
```

### 使用配置文件 | Use Config File

```bash
agent-gen -c config.json
```

## 命令行选项 | Command Line Options

| 短选项 | 长选项 | 说明 | Description |
|--------|--------|------|-------------|
| `-a` | `--auto-detect` | 自动检测项目配置 | Auto-detect project config |
| `-t` | `--template` | 指定模板 | Specify template |
| `-o` | `--output` | 输出路径 (默认: ./agent.md) | Output path (default: ./agent.md) |
| `-c` | `--config` | 配置文件路径 | Config file path |
| `-p` | `--project` | 项目路径 (默认: cwd) | Project path (default: cwd) | 
| | `--auto-read` | 自动读取配置不提示 | Auto-read config without prompt |
| | `--list-templates` | 列出所有模板 | List all templates |
| `-h` | `--help` | 显示帮助 | Show help |

## 模板列表 | Available Templates

### 角色型 | Role-based

| ID | 名称 | Name | 描述 | Description |
|----|------|------|------|-------------|
| `frontend` | 前端开发者 | Frontend Developer | 现代前端框架专家 | Expert in modern JS frameworks |
| `backend` | 后端开发者 | Backend Developer | 服务端架构专家 | Expert in server-side architecture |
| `fullstack` | 全栈开发者 | Full-Stack Developer | 前后端全栈开发 | Full-stack web development |

### 任务型 | Task-based

| ID | 名称 | Name | 描述 | Description |
|----|------|------|------|-------------|
| `bug-fix` | Bug 修复专家 | Bug Fix Expert | 调试和修复专家 | Debugging and fixing bugs |
| `feature-dev` | 功能开发专家 | Feature Developer | 新功能实现 | Implement new features |
| `refactor` | 代码重构专家 | Refactoring Expert | 代码质量优化 | Improve code quality |

### 通用型 | General

| ID | 名称 | Name | 描述 | Description |
|----|------|------|------|-------------|
| `docs-gen` | 文档生成 | Documentation Generator | 技术文档创建 | Create technical docs |
| `testing` | 测试工程师 | Testing Engineer | 全面测试编写 | Write comprehensive tests |
| `code-review` | 代码审查 | Code Reviewer | 代码审查和质量 | Code review and quality |

## 技术栈检测 | Tech Stack Detection

### 支持的框架 | Supported Frameworks

- **Frontend**: React, Vue, Angular, Svelte, Next.js, Nuxt
- **Backend**: Express, Nest, Fastify, Django, Flask, FastAPI, Spring, Gin, Fiber

### 支持的工具 | Supported Tools

- **Languages**: TypeScript
- **Linting/Formatting**: ESLint, Prettier, Black, Flake8
- **CSS**: TailwindCSS, Sass, Less, Styled Components
- **Build**: Vite, Webpack, Rollup
- **Testing**: Jest, Vitest, Cypress, Playwright, Pytest
- **State**: Redux, Zustand, React Query

## 示例 | Examples

### 自动检测 + 文档生成

```bash
agent-gen -a -t docs-gen
```

输出：
```
🔍 Auto-detecting project config...
📁 Project: my-project
🛠️  Tech stack: react, next
🔧 Tools: typescript, tailwindcss, jest
🤖 Auto-selected template: frontend based on project type

✅ Agent.md generated successfully at: ./agent.md
```

### 查看所有模板

```bash
agent-gen --list-templates
```

### 查看帮助

```bash
agent-gen --help
```

## 项目结构 | Project Structure

```
agent-md-generator/
├── bin/
│   └── agent-gen.js          # CLI 入口
├── src/
│   ├── index.js               # 主逻辑
│   ├── template.js            # 模板处理
│   ├── config.js              # 配置加载
│   ├── questions.js           # 交互问答
│   ├── project-config.js      # 项目配置检测
│   └── templates/             # 模板文件
│       ├── role-based/        # 角色型模板
│       ├── task-based/        # 任务型模板
│       └── general/           # 通用型模板
└── test/
    └── test-agent-gen.js      # 测试脚本
```

## 许可证 | License

MIT