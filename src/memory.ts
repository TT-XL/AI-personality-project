// AI人格项目 - 记忆系统

import * as fs from 'fs'
import * as path from 'path'

const MEMORY_DIR = path.join(process.cwd(), 'memories')

export interface MemoryEntry {
  timestamp: string
  userMessage: string
  aiReply: string
  topic?: string
  mood?: string
}

export interface MemoryData {
  slug: string
  conversations: MemoryEntry[]
  keyTopics: string[]
  importantEvents: string[]
  userPreferences: string[]
}

export class MemoryManager {
  private data: MemoryData | null = null
  private slug: string = ''

  // 加载记忆
  load(slug: string): void {
    this.slug = slug
    
    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true })
    }

    const filePath = path.join(MEMORY_DIR, `${slug}.json`)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      this.data = JSON.parse(content)
    } else {
      this.data = {
        slug,
        conversations: [],
        keyTopics: [],
        importantEvents: [],
        userPreferences: [],
      }
    }
  }

  // 保存记忆
  save(): void {
    if (!this.data) return

    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true })
    }

    const filePath = path.join(MEMORY_DIR, `${this.slug}.json`)
    fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2))
  }

  // 添加对话记忆
  addConversation(userMessage: string, aiReply: string): void {
    if (!this.data) return

    const entry: MemoryEntry = {
      timestamp: new Date().toISOString(),
      userMessage,
      aiReply,
      topic: this.extractTopic(userMessage),
      mood: this.extractMood(aiReply),
    }

    this.data.conversations.push(entry)

    // 保留最近50条对话
    if (this.data.conversations.length > 50) {
      this.data.conversations = this.data.conversations.slice(-50)
    }

    // 提取关键话题
    this.extractKeyTopics(userMessage)

    // 提取用户偏好
    this.extractUserPreferences(userMessage)

    this.save()
  }

  // 提取话题
  private extractTopic(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('吃') || lowerMessage.includes('饭')) return '饮食'
    if (lowerMessage.includes('工作') || lowerMessage.includes('上班')) return '工作'
    if (lowerMessage.includes('游戏') || lowerMessage.includes('玩')) return '娱乐'
    if (lowerMessage.includes('天气') || lowerMessage.includes('下雨')) return '天气'
    if (lowerMessage.includes('想') || lowerMessage.includes('爱')) return '感情'
    if (lowerMessage.includes('睡') || lowerMessage.includes('休息')) return '作息'
    if (lowerMessage.includes('电影') || lowerMessage.includes('音乐')) return '兴趣'
    
    return '日常'
  }

  // 提取情绪
  private extractMood(reply: string): string {
    const lowerReply = reply.toLowerCase()
    
    if (lowerReply.includes('开心') || lowerReply.includes('哈哈') || lowerReply.includes('嘿嘿')) return '开心'
    if (lowerReply.includes('生气') || lowerReply.includes('滚') || lowerReply.includes('烦')) return '生气'
    if (lowerReply.includes('难过') || lowerReply.includes('伤心')) return '难过'
    if (lowerReply.includes('想') || lowerReply.includes('爱')) return '喜欢'
    
    return '正常'
  }

  // 提取关键话题
  private extractKeyTopics(message: string): void {
    if (!this.data) return

    const topics = this.extractTopic(message)
    if (!this.data.keyTopics.includes(topics)) {
      this.data.keyTopics.push(topics)
    }

    // 保留最近10个话题
    if (this.data.keyTopics.length > 10) {
      this.data.keyTopics = this.data.keyTopics.slice(-10)
    }
  }

  // 提取用户偏好
  private extractUserPreferences(message: string): void {
    if (!this.data) return

    const lowerMessage = message.toLowerCase()
    
    // 提取喜欢的东西
    if (lowerMessage.includes('喜欢')) {
      const match = lowerMessage.match(/喜欢(.{1,10})/)
      if (match && !this.data.userPreferences.includes(match[1])) {
        this.data.userPreferences.push(`喜欢${match[1]}`)
      }
    }

    // 提取不喜欢的东西
    if (lowerMessage.includes('不喜欢') || lowerMessage.includes('讨厌')) {
      const match = lowerMessage.match(/(?:不喜欢|讨厌)(.{1,10})/)
      if (match && !this.data.userPreferences.includes(`不喜欢${match[1]}`)) {
        this.data.userPreferences.push(`不喜欢${match[1]}`)
      }
    }

    // 保留最近10个偏好
    if (this.data.userPreferences.length > 10) {
      this.data.userPreferences = this.data.userPreferences.slice(-10)
    }
  }

  // 添加重要事件
  addImportantEvent(event: string): void {
    if (!this.data) return

    if (!this.data.importantEvents.includes(event)) {
      this.data.importantEvents.push(event)
    }

    // 保留最近5个重要事件
    if (this.data.importantEvents.length > 5) {
      this.data.importantEvents = this.data.importantEvents.slice(-5)
    }

    this.save()
  }

  // 获取最近对话
  getRecentConversations(count: number = 5): MemoryEntry[] {
    if (!this.data) return []
    return this.data.conversations.slice(-count)
  }

  // 获取关键话题
  getKeyTopics(): string[] {
    return this.data?.keyTopics || []
  }

  // 获取重要事件
  getImportantEvents(): string[] {
    return this.data?.importantEvents || []
  }

  // 获取用户偏好
  getUserPreferences(): string[] {
    return this.data?.userPreferences || []
  }

  // 获取记忆摘要
  getMemorySummary(): string {
    if (!this.data || this.data.conversations.length === 0) {
      return '还没有聊过天'
    }

    const recentConversations = this.getRecentConversations(3)
    const topics = this.getKeyTopics()
    const preferences = this.getUserPreferences()

    let summary = `之前聊过 ${this.data.conversations.length} 次\n`
    
    if (topics.length > 0) {
      summary += `聊过的话题：${topics.join('、')}\n`
    }
    
    if (preferences.length > 0) {
      summary += `用户喜好：${preferences.join('、')}\n`
    }

    if (recentConversations.length > 0) {
      summary += `最近聊了：${recentConversations.map(c => c.topic || '日常').join('、')}`
    }

    return summary
  }

  // 获取系统提示词片段
  getSystemPromptFragment(): string {
    if (!this.data || this.data.conversations.length === 0) {
      return ''
    }

    const summary = this.getMemorySummary()
    const recentConversations = this.getRecentConversations(3)

    let fragment = `## 之前的聊天记忆\n${summary}\n`

    if (recentConversations.length > 0) {
      fragment += `### 最近的对话\n`
      recentConversations.forEach(c => {
        fragment += `- 用户说：${c.userMessage.substring(0, 30)}...\n`
        fragment += `- 你回复：${c.aiReply.substring(0, 30)}...\n`
      })
    }

    return fragment
  }

  // 清除记忆
  clear(): void {
    this.data = {
      slug: this.slug,
      conversations: [],
      keyTopics: [],
      importantEvents: [],
      userPreferences: [],
    }
    this.save()
  }
}

export const memoryManager = new MemoryManager()
