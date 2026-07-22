// AI人格项目 - 学习进化系统

import * as fs from 'fs'
import * as path from 'path'

const LEARNING_DIR = path.join(process.cwd(), 'learning')

export interface LearningData {
  slug: string
  successfulResponses: string[]
  failedResponses: string[]
  userPatterns: string[]
  emotionalStates: string[]
  learnedBehaviors: string[]
  lastUpdated: string
}

export class Learner {
  private data: LearningData | null = null
  private slug: string = ''

  // 加载学习数据
  load(slug: string): void {
    this.slug = slug
    
    if (!fs.existsSync(LEARNING_DIR)) {
      fs.mkdirSync(LEARNING_DIR, { recursive: true })
    }

    const filePath = path.join(LEARNING_DIR, `${slug}.json`)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      this.data = JSON.parse(content)
    } else {
      this.data = {
        slug,
        successfulResponses: [],
        failedResponses: [],
        userPatterns: [],
        emotionalStates: [],
        learnedBehaviors: [],
        lastUpdated: new Date().toISOString(),
      }
    }
  }

  // 保存学习数据
  save(): void {
    if (!this.data) return

    if (!fs.existsSync(LEARNING_DIR)) {
      fs.mkdirSync(LEARNING_DIR, { recursive: true })
    }

    this.data.lastUpdated = new Date().toISOString()
    const filePath = path.join(LEARNING_DIR, `${this.slug}.json`)
    fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2))
  }

  // 记录成功的回复
  recordSuccess(response: string): void {
    if (!this.data) return
    
    // 避免重复
    if (!this.data.successfulResponses.includes(response)) {
      this.data.successfulResponses.push(response)
      
      // 保留最近50条
      if (this.data.successfulResponses.length > 50) {
        this.data.successfulResponses.shift()
      }
    }
  }

  // 记录失败的回复
  recordFailure(response: string): void {
    if (!this.data) return
    
    if (!this.data.failedResponses.includes(response)) {
      this.data.failedResponses.push(response)
      
      // 保留最近20条
      if (this.data.failedResponses.length > 20) {
        this.data.failedResponses.shift()
      }
    }
  }

  // 学习用户模式
  learnUserPattern(message: string): void {
    if (!this.data) return
    
    // 提取关键词
    const keywords = this.extractKeywords(message)
    
    keywords.forEach(keyword => {
      if (!this.data!.userPatterns.includes(keyword)) {
        this.data!.userPatterns.push(keyword)
      }
    })
    
    // 保留最近100个关键词
    if (this.data.userPatterns.length > 100) {
      this.data.userPatterns = this.data.userPatterns.slice(-100)
    }
  }

  // 学习情绪状态
  learnEmotionalState(message: string, response: string): void {
    if (!this.data) return
    
    // 分析情绪
    const emotion = this.analyzeEmotion(message)
    if (emotion) {
      this.data.emotionalStates.push(emotion)
      
      // 保留最近50条
      if (this.data.emotionalStates.length > 50) {
        this.data.emotionalStates.shift()
      }
    }
  }

  // 学习新的行为
  learnBehavior(pattern: string): void {
    if (!this.data) return
    
    if (!this.data.learnedBehaviors.includes(pattern)) {
      this.data.learnedBehaviors.push(pattern)
      
      // 保留最近30条
      if (this.data.learnedBehaviors.length > 30) {
        this.data.learnedBehaviors.shift()
      }
    }
  }

  // 获取学习到的建议
  getSuggestions(): string {
    if (!this.data) return ''
    
    const suggestions: string[] = []
    
    // 从成功的回复中学习
    if (this.data.successfulResponses.length > 0) {
      suggestions.push('用户喜欢的回复风格：简短、自然、有情绪')
    }
    
    // 从失败的回复中学习
    if (this.data.failedResponses.length > 0) {
      suggestions.push('避免：过于正式、太长、太友好')
    }
    
    // 从用户模式中学习
    if (this.data.userPatterns.length > 0) {
      suggestions.push('用户常用词：' + this.data.userPatterns.slice(-5).join('、'))
    }
    
    // 从情绪状态中学习
    if (this.data.emotionalStates.length > 0) {
      suggestions.push('情绪模式：用户喜欢有情绪变化的回复')
    }
    
    // 从学习到的行为中学习
    if (this.data.learnedBehaviors.length > 0) {
      suggestions.push('学到的行为：' + this.data.learnedBehaviors.slice(-3).join('、'))
    }
    
    return suggestions.join('\n')
  }

  // 获取学习统计
  getStats(): string {
    if (!this.data) return '无学习数据'
    
    return `
学习统计：
- 成功回复：${this.data.successfulResponses.length} 条
- 失败回复：${this.data.failedResponses.length} 条
- 用户关键词：${this.data.userPatterns.length} 个
- 情绪状态：${this.data.emotionalStates.length} 条
- 学到的行为：${this.data.learnedBehaviors.length} 条
- 最后更新：${this.data.lastUpdated}
`
  }

  // 提取关键词
  private extractKeywords(message: string): string[] {
    const keywords: string[] = []
    const words = message.split(/[\s\n]+/)
    
    words.forEach(word => {
      if (word.length >= 2 && word.length <= 4) {
        keywords.push(word)
      }
    })
    
    return keywords
  }

  // 分析情绪
  private analyzeEmotion(message: string): string | null {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('开心') || lowerMessage.includes('高兴') || lowerMessage.includes('哈哈')) {
      return '开心'
    }
    
    if (lowerMessage.includes('生气') || lowerMessage.includes('愤怒') || lowerMessage.includes('滚')) {
      return '生气'
    }
    
    if (lowerMessage.includes('难过') || lowerMessage.includes('伤心') || lowerMessage.includes('哭')) {
      return '难过'
    }
    
    if (lowerMessage.includes('想你') || lowerMessage.includes('喜欢') || lowerMessage.includes('爱')) {
      return '喜欢'
    }
    
    return null
  }

  // 清除学习数据
  clear(): void {
    this.data = {
      slug: this.slug,
      successfulResponses: [],
      failedResponses: [],
      userPatterns: [],
      emotionalStates: [],
      learnedBehaviors: [],
      lastUpdated: new Date().toISOString(),
    }
    this.save()
  }
}

export const learner = new Learner()
