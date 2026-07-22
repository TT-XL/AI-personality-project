# AI人格模拟项目

把人蒸馏成 AI Skill，让AI用ta的方式说话、用ta的逻辑思考。

## 功能特性

-   **多数据源支持**：微信聊天记录、QQ消息、朋友圈截图、照片
-   **双层结构**：关系记忆（Part A）+ 人物性格（Part B）
-   **持续进化**：支持追加记忆、对话纠正、版本管理
-   **多平台兼容**：Claude Code、OpenClaw、MiMoCode

## 快速开始

### 安装

```bash
git clone https://github.com/TT-XL/AI-personality-project.git
cd AI-personality-project
npm install
```

### 使用

```bash
# 创建新人格
npm run create

# 列出所有人格
npm run list

# 聊天模式
npm run chat <slug>
```

## 项目结构

```
AI-personality-project/
├── src/
│   ├── index.ts           # 主入口
│   ├── creator.ts         # 人格创建器
│   ├── analyzer.ts        # 数据分析器
│   └── chat.ts            # 聊天引擎
├── skills/                # 生成的人格Skill
├── examples/              # 示例数据
├── package.json
└── README.md
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

## 命令列表

| 命令 | 说明 |
|------|------|
| `/create` | 创建新人格 |
| `/list` | 列出所有人格 |
| `/chat <slug>` | 聊天模式 |
| `/update <slug>` | 更新人格 |
| `/delete <slug>` | 删除人格 |

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
