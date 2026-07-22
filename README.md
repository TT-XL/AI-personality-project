# AI人格模拟项目

把人蒸馏成 AI Skill，让AI用ta的方式说话、用ta的逻辑思考。

## 功能特性

-   **多数据源支持**：微信聊天记录、QQ消息、朋友圈截图、照片
-   **双层结构**：关系记忆（Part A）+ 人物性格（Part B）
-   **持续进化**：支持追加记忆、对话纠正、版本管理
-   **多平台兼容**：Claude Code、OpenClaw、MiMoCode
-   **AI接入**：支持 OpenAI、DeepSeek、智谱 等AI服务商

## 快速开始

### 安装

```bash
git clone https://github.com/TT-XL/AI-personality-project.git
cd AI-personality-project
npm install
```

### 使用

#### 基础版（本地回复）
```bash
npm run dev
```

#### AI版（接入真实AI）
```bash
# 1. 配置AI（Windows PowerShell）
$env:AI_API_KEY="你的API密钥"
$env:AI_PROVIDER="openai"  # 或 deepseek / zhipu
$env:AI_MODEL="gpt-3.5-turbo"

# 2. 运行
npm run dev:ai
```

### 命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `create <名字>` | 创建人格 | `create 小明` |
| `list` | 列出所有人格 | `list` |
| `chat <名字>` | 与人格聊天 | `chat 小明` |
| `delete <名字>` | 删除人格 | `delete 小明` |
| `config` | 查看AI配置 | `config` |
| `help` | 显示帮助 | `help` |
| `quit` | 退出 | `quit` |

## 项目结构

```
AI-personality-project/
├── src/
│   ├── index.ts           # 基础版入口
│   ├── index-ai.ts        # AI版入口
│   ├── creator.ts         # 人格创建器
│   ├── analyzer.ts        # 数据分析器
│   ├── chat.ts            # 基础聊天引擎
│   ├── chat-ai.ts         # AI聊天引擎
│   └── types.ts           # 类型定义
├── skills/                # 生成的人格Skill
├── sessions/              # 聊天记录
├── .env.example           # 环境变量示例
├── package.json
└── README.md
```

## AI配置

### 支持的AI服务商

| 服务商 | API地址 | 模型示例 |
|--------|---------|----------|
| OpenAI | https://api.openai.com/v1 | gpt-3.5-turbo, gpt-4 |
| DeepSeek | https://api.deepseek.com/v1 | deepseek-chat |
| 智谱 | https://open.bigmodel.cn/api/paas/v4 | glm-4 |

### 配置方法

#### 方法1：环境变量（推荐）
```bash
# Windows PowerShell
$env:AI_API_KEY="sk-xxx"
$env:AI_PROVIDER="openai"
$env:AI_MODEL="gpt-3.5-turbo"

# Linux/Mac
export AI_API_KEY="sk-xxx"
export AI_PROVIDER="openai"
export AI_MODEL="gpt-3.5-turbo"
```

#### 方法2：.env文件
```bash
cp .env.example .env
# 编辑 .env 文件填入配置
```

## 数据源格式

| 来源 | 格式 | 备注 |
|------|------|------|
| 微信聊天记录 | txt/html/json | 推荐 |
| QQ聊天记录 | txt/mht | 适合学生时代 |
| 朋友圈/微博 | 截图 | 提取公开人设 |
| 照片 | JPEG/PNG | 提取时间线和地点 |
| 口述/粘贴 | 纯文本 | 你的主观记忆 |

## 生成的Skill结构

每个Skill由两部分组成：

### Part A：关系记忆
- 共同经历
- 约会地点
- Inside jokes
- 争吵模式
- 甜蜜瞬间
- 关系时间线

### Part B：人物性格
- Layer 0：硬规则
- Layer 1：身份
- Layer 2：说话风格
- Layer 3：情感模式
- Layer 4：关系行为

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
