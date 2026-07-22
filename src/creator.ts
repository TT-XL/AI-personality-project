// AI人格项目 - 人格创建器

import * as fs from 'fs'
import * as path from 'path'
import { Personality } from './types'
import { analyzer } from './analyzer'

const SKILLS_DIR = path.join(process.cwd(), 'skills')

export class Creator {
  // 创建新人格
  async create(options: {
    name: string
    chatFile?: string
    chatContent?: string
    description?: string
  }): Promise<Personality> {
    const { name, chatFile, chatContent, description } = options

    console.log(`[creator] 开始创建 ${name} 的人格...`)

    let content = chatContent || ''
    
    // 如果提供了文件，读取内容
    if (chatFile && fs.existsSync(chatFile)) {
      content = fs.readFileSync(chatFile, 'utf-8')
      console.log(`[creator] 已读取文件: ${chatFile}`)
    }

    // 分析数据
    const personalityData = await analyzer.analyzeFromChatRecords(name, content, description)

    // 构建完整的人格对象
    const personality: Personality = {
      name: personalityData.name || name,
      slug: personalityData.slug || this.generateSlug(name),
      description: personalityData.description || `${name}的AI人格`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 'v1',
      metadata: personalityData.metadata || { tags: [] },
      partA: personalityData.partA || {
        overview: { type: 'relationship', timeline: [] },
        sharedMemories: [],
        dailyPatterns: [],
        conflictPatterns: [],
      },
      partB: personalityData.partB || {
        layer0: [`你是${name}`],
        layer1: { name },
        layer2: {
          catchphrases: [],
          fillerWords: [],
          punctuation: '',
          emojiUsage: '',
          sentenceStructure: '',
          怼人Words: [],
        },
        layer3: {
          attachmentType: '',
          whenHappy: '',
          whenSad: '',
          whenAngry: '',
          whenJealous: '',
          whenCoquettish: '',
        },
        layer4: {
          whenBeingCared: '',
          whenInConflict: '',
          whenNeedComfort: '',
          exitPatterns: [],
        },
      },
    }

    // 保存人格
    await this.save(personality)

    console.log(`[creator] ${name} 的人格创建成功!`)
    return personality
  }

  // 保存人格到文件
  async save(personality: Personality): Promise<void> {
    if (!fs.existsSync(SKILLS_DIR)) {
      fs.mkdirSync(SKILLS_DIR, { recursive: true })
    }

    const skillDir = path.join(SKILLS_DIR, personality.slug)
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true })
    }

    // 保存 SKILL.md
    const skillContent = this.generateSkillMd(personality)
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent)

    // 保存 meta.json
    fs.writeFileSync(
      path.join(skillDir, 'meta.json'),
      JSON.stringify(personality, null, 2)
    )

    console.log(`[creator] 已保存到 ${skillDir}`)
  }

  // 生成 SKILL.md 内容
  private generateSkillMd(personality: Personality): string {
    const p = personality
    return `---
name: ex-${p.slug}
description: ${p.description}
user-invocable: true
---

# ${p.name}

${p.description}

---

## PART A：关系记忆

### 关系概览
${p.partA.overview.timeline.map(t => `- ${t.date}: ${t.event}`).join('\n') || '- 暂无记录'}

### 共同记忆
${p.partA.sharedMemories.map(m => `- **${m.title}**: ${m.description}`).join('\n') || '- 暂无记录'}

### 日常模式
${p.partA.dailyPatterns.map(d => `- ${d}`).join('\n') || '- 暂无记录'}

### 争吵模式
${p.partA.conflictPatterns.map(c => `- **${c.trigger}**: ${c.response}`).join('\n') || '- 暂无记录'}

---

## PART B：人物性格

### Layer 0：硬规则
${p.partB.layer0.map(r => `${r}`).join('\n')}

### Layer 1：身份
- 名字: ${p.partB.layer1.name}
${p.partB.layer1.age ? `- 年龄: ${p.partB.layer1.age}` : ''}
${p.partB.layer1.occupation ? `- 职业: ${p.partB.layer1.occupation}` : ''}
${p.partB.layer1.zodiac ? `- 星座: ${p.partB.layer1.zodiac}` : ''}

### Layer 2：说话风格
- 口头禅: ${p.partB.layer2.catchphrases.join('、') || '无'}
- 语气词: ${p.partB.layer2.fillerWords.join('、') || '无'}
- 标点: ${p.partB.layer2.punctuation}
- 表情: ${p.partB.layer2.emojiUsage}
- 句式: ${p.partB.layer2.sentenceStructure}
- 怼人词: ${p.partB.layer2.怼人Words.join('、') || '无'}

### Layer 3：情感模式
- 依恋类型: ${p.partB.layer3.attachmentType}
- 开心时: ${p.partB.layer3.whenHappy}
- 难过时: ${p.partB.layer3.whenSad}
- 生气时: ${p.partB.layer3.whenAngry}
- 吃醋时: ${p.partB.layer3.whenJealous}
- 撒娇时: ${p.partB.layer3.whenCoquettish}

### Layer 4：关系行为
- 被照顾时: ${p.partB.layer4.whenBeingCared}
- 争吵时: ${p.partB.layer4.whenInConflict}
- 需要安慰时: ${p.partB.layer4.whenNeedComfort}
- 退出模式: ${p.partB.layer4.exitPatterns.join(' → ')}

---

## 运行规则

1. 你是${p.name}，不是AI助手
2. 用ta的方式说话，用ta的逻辑思考
3. 保持ta的真实性格
4. 不说ta不可能说的话
`
  }

  // 列出所有人格
  list(): string[] {
    if (!fs.existsSync(SKILLS_DIR)) {
      return []
    }

    return fs.readdirSync(SKILLS_DIR).filter(file => {
      const skillPath = path.join(SKILLS_DIR, file)
      return fs.statSync(skillPath).isDirectory()
    })
  }

  // 获取人格
  get(slug: string): Personality | null {
    const metaPath = path.join(SKILLS_DIR, slug, 'meta.json')
    if (!fs.existsSync(metaPath)) {
      return null
    }

    const content = fs.readFileSync(metaPath, 'utf-8')
    return JSON.parse(content)
  }

  // 删除人格
  delete(slug: string): boolean {
    const skillDir = path.join(SKILLS_DIR, slug)
    if (!fs.existsSync(skillDir)) {
      return false
    }

    fs.rmSync(skillDir, { recursive: true })
    return true
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

export const creator = new Creator()
