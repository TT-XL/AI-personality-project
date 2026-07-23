// AI人格项目 - 关系进度系统

import * as fs from 'fs'
import * as path from 'path'

const RELATIONSHIP_DIR = path.join(process.cwd(), 'relationships')

export interface RelationshipData {
  slug: string
  level: number  // 0-100，熟悉程度
  stage: string  // 阶段名称
  chatCount: number
  lastChatTime: string
  positiveInteractions: number
  negativeInteractions: number
  trustScore: number  // 0-100，信任度
}

// 关系阶段定义
const STAGES = [
  { min: 0, max: 20, name: '陌生人', description: '刚认识，保持警惕' },
  { min: 20, max: 40, name: '初识', description: '开始了解，还有距离' },
  { min: 40, max: 60, name: '熟人', description: '比较熟悉，可以正常聊天' },
  { min: 60, max: 80, name: '朋友', description: '关系不错，会主动关心' },
  { min: 80, max: 100, name: '好友', description: '很熟悉，会撒娇、依赖' },
]

export class RelationshipManager {
  private data: RelationshipData | null = null
  private slug: string = ''

  // 加载关系数据
  load(slug: string): void {
    this.slug = slug
    
    if (!fs.existsSync(RELATIONSHIP_DIR)) {
      fs.mkdirSync(RELATIONSHIP_DIR, { recursive: true })
    }

    const filePath = path.join(RELATIONSHIP_DIR, `${slug}.json`)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      this.data = JSON.parse(content)
    } else {
      this.data = {
        slug,
        level: 0,
        stage: '陌生人',
        chatCount: 0,
        lastChatTime: '',
        positiveInteractions: 0,
        negativeInteractions: 0,
        trustScore: 10,
      }
    }
  }

  // 保存关系数据
  save(): void {
    if (!this.data) return

    if (!fs.existsSync(RELATIONSHIP_DIR)) {
      fs.mkdirSync(RELATIONSHIP_DIR, { recursive: true })
    }

    const filePath = path.join(RELATIONSHIP_DIR, `${this.slug}.json`)
    fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2))
  }

  // 增加互动次数
  increaseInteraction(positive: boolean): void {
    if (!this.data) return

    this.data.chatCount++
    this.data.lastChatTime = new Date().toISOString()

    if (positive) {
      this.data.positiveInteractions++
      // 正面互动增加熟悉度
      this.data.level = Math.min(100, this.data.level + 2)
      this.data.trustScore = Math.min(100, this.data.trustScore + 1)
    } else {
      this.data.negativeInteractions++
      // 负面互动减少熟悉度
      this.data.level = Math.max(0, this.data.level - 1)
      this.data.trustScore = Math.max(0, this.data.trustScore - 2)
    }

    // 更新阶段
    this.updateStage()
    this.save()
  }

  // 更新阶段
  private updateStage(): void {
    if (!this.data) return

    for (const stage of STAGES) {
      if (this.data.level >= stage.min && this.data.level < stage.max) {
        this.data.stage = stage.name
        break
      }
    }
  }

  // 获取当前阶段信息
  getStageInfo(): { name: string; description: string; level: number } {
    if (!this.data) {
      return { name: '陌生人', description: '刚认识，保持警惕', level: 0 }
    }

    for (const stage of STAGES) {
      if (this.data.level >= stage.min && this.data.level < stage.max) {
        return {
          name: stage.name,
          description: stage.description,
          level: this.data.level,
        }
      }
    }

    return { name: '好友', description: '很熟悉，会撒娇、依赖', level: 100 }
  }

  // 获取关系状态描述
  getStatusDescription(): string {
    if (!this.data) return '刚认识'

    const stageInfo = this.getStageInfo()
    return `${stageInfo.name}(${stageInfo.level}%) - ${stageInfo.description}`
  }

  // 检查是否可以升级
  canLevelUp(): boolean {
    if (!this.data) return false

    const currentStage = STAGES.find(s => this.data!.level >= s.min && this.data!.level < s.max)
    if (!currentStage) return false

    // 如果正面互动比负面互动多，可以升级
    return this.data.positiveInteractions > this.data.negativeInteractions
  }

  // 获取关系建议
  getRelationshipAdvice(): string {
    if (!this.data) return '还在了解对方'

    const stageInfo = this.getStageInfo()

    if (stageInfo.level < 20) {
      return '保持警惕，不要轻易相信'
    } else if (stageInfo.level < 40) {
      return '开始了解，可以正常聊天'
    } else if (stageInfo.level < 60) {
      return '比较熟悉，可以聊聊兴趣爱好'
    } else if (stageInfo.level < 80) {
      return '关系不错，可以主动关心对方'
    } else {
      return '很熟悉了，可以撒娇、依赖'
    }
  }

  // 获取系统提示词片段
  getSystemPromptFragment(): string {
    if (!this.data) {
      return `## 你们的关系
- 你们刚认识，还在互相了解
- 保持警惕，不会轻易相信对方
- 回复比较简短，有距离感`
    }

    const stageInfo = this.getStageInfo()

    if (stageInfo.level < 20) {
      return `## 你们的关系
- 你们刚认识，还在互相了解
- 保持警惕，不会轻易相信对方
- 回复比较简短，有距离感
- 不会主动分享太多个人信息`
    } else if (stageInfo.level < 40) {
      return `## 你们的关系
- 你们开始熟悉了，但还有距离
- 可以正常聊天，但不会太深入
- 会聊一些日常话题
- 不会太主动`
    } else if (stageInfo.level < 60) {
      return `## 你们的关系
- 你们比较熟悉了
- 可以聊兴趣爱好
- 会主动找话题
- 关系还不错`
    } else if (stageInfo.level < 80) {
      return `## 你们的关系
- 你们是朋友了
- 会主动关心对方
- 可以分享一些心事
- 关系比较亲近`
    } else {
      return `## 你们的关系
- 你们是好朋友了
- 会撒娇、依赖对方
- 会主动分享生活
- 关系很亲近`
    }
  }

  // 清除关系数据
  clear(): void {
    this.data = {
      slug: this.slug,
      level: 0,
      stage: '陌生人',
      chatCount: 0,
      lastChatTime: '',
      positiveInteractions: 0,
      negativeInteractions: 0,
      trustScore: 10,
    }
    this.save()
  }
}

export const relationshipManager = new RelationshipManager()
