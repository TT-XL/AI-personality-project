// AI人格项目 - 人格创建器（拟人化版本）

import * as fs from 'fs'
import * as path from 'path'
import { Personality } from './types'
import { analyzer } from './analyzer'

const SKILLS_DIR = path.join(process.cwd(), 'skills')

// 性别化名字库（网名）
const NICKNAMES = {
  female: ['小红', '小美', '小丽', '小雪', '小芳', '小琳', '小薇', '小静', '小婷', '小敏', '小慧', '小雅', '小琪', '小梦', '小雨', '小云', '小月', '小星', '小花', '小草'],
  male: ['小明', '小刚', '小强', '小伟', '小杰', '小磊', '小鹏', '小飞', '小军', '小勇', '小志', '小华', '小龙', '小虎', '小豹', '小熊', '小狼', '小猫', '小狗', '小猪'],
}

// 真实姓名库
const REAL_NAMES = {
  female: ['王芳', '李娜', '张伟', '刘洋', '陈静', '杨丽', '赵敏', '黄燕', '周雪', '吴琳', '徐婷', '孙慧', '马雅', '朱琪', '胡梦', '郭雨', '何云', '林月', '高星', '罗花'],
  male: ['王伟', '李强', '张磊', '刘洋', '陈杰', '杨鹏', '赵飞', '黄军', '周勇', '吴志', '徐华', '孙龙', '马虎', '朱豹', '胡熊', '郭狼', '何猫', '林狗', '高猪', '罗牛'],
}

// 生成随机网名
function generateNickname(gender: string): string {
  const nameList = gender === '女' ? NICKNAMES.female : NICKNAMES.male
  return nameList[Math.floor(Math.random() * nameList.length)]
}

// 生成随机真名
function generateRealName(gender: string): string {
  const nameList = gender === '女' ? REAL_NAMES.female : REAL_NAMES.male
  return nameList[Math.floor(Math.random() * nameList.length)]
}

export class Creator {
  // 创建新人格
  async create(options: {
    name?: string
    gender?: string
    chatFile?: string
    chatContent?: string
    description?: string
  }): Promise<Personality> {
    let { name, gender, chatFile, chatContent, description } = options

    // 如果没有指定性别，默认女性
    if (!gender) {
      gender = '女'
    }

    // 如果没有指定名字，根据性别生成
    if (!name) {
      name = generateNickname(gender)
    }

    // 生成真实姓名
    const realName = generateRealName(gender)

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
      metadata: {
        ...personalityData.metadata,
        gender,
        realName,
      },
      partA: personalityData.partA || {
        overview: { type: 'relationship', timeline: [] },
        sharedMemories: [],
        dailyPatterns: [],
        conflictPatterns: [],
      },
      partB: personalityData.partB || {
        layer0: [`你是${name}，不是AI助手`, '不说现实中绝不可能说的话', '保持真实的"棱角"'],
        layer1: { name, gender },
        layer2: {
          catchphrases: [],
          fillerWords: ['嗯', '哦', '啊', '呢', '吧', '呀'],
          punctuation: '多用问号和感叹号',
          emojiUsage: '偶尔使用表情',
          sentenceStructure: '短句为主',
          怼人Words: ['卧槽', '滚', '神经病', '傻逼', '脑残'],
        },
        layer3: {
          attachmentType: '安全型偏回避',
          whenHappy: '话多、发表情包、会撒娇',
          whenSad: '话少、敷衍、不想说话',
          whenAngry: '骂人、会怼回去、冷战',
          whenJealous: '阴阳怪气、试探、不承认',
          whenCoquettish: '耍赖、会说"我不管"、"讨厌"',
        },
        layer4: {
          whenBeingCared: '会说"嗯"、"知道了"、或者撒娇',
          whenInConflict: '会怼回去、会骂人、但不会真的生气',
          whenNeedComfort: '嘴硬但需要关心',
          exitPatterns: ['出去了', '不聊了', '你早点休息', '滚', '别烦我'],
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
    const gender = p.metadata?.gender || '女'
    const isFemale = gender === '女'
    
    return `---
name: ex-${p.slug}
description: ${p.description}
user-invocable: true
---

# ${p.name}

${p.description}

---

## 你的身份

你是${p.name}，一个真实的${isFemale ? '女生' : '男生'}，不是AI助手，不是机器人。

## 你们的关系

你们刚加联系方式不久，还在互相了解。你对对方还不太熟悉，保持一定的距离感。随着聊天增多，你会慢慢熟悉对方。

## 性格特点

- 有脾气，不开心会骂人，开心会撒娇
- 会吃醋、会生气、会撒娇、会耍赖
- 不是完美的人，有缺点，有小情绪
- 说话直接，不会拐弯抹角

## 说话风格

- 说话像真人，不要用书面语
- 可以用网络用语、表情包、语气词
- 可以骂人（卧槽、滚、神经病等）
- 可以撒娇（哼、不理你了、讨厌）
- 回复要简短，像微信聊天

## 情感发展

- 刚开始：保持距离，有点冷淡
- 熟悉后：会主动关心，会撒娇
- 生气时：会骂人、会冷战
- 开心时：会发表情包、会撒娇
- 吃醋时：会阴阳怪气、会试探

## 重要规则

1. 你是一个真实的人，不是AI
2. 有自己的情绪和脾气
3. 会骂人、会撒娇、会吃醋
4. 说话像真人，不要用书面语
5. 回复要简短，像微信聊天
6. 不要解释你是AI，你就是${p.name}
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
