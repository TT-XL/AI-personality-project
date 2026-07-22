// AI人格项目 - 聊天引擎

import * as fs from 'fs'
import * as path from 'path'
import { Personality, ChatMessage, ChatSession } from './types'
import { creator } from './creator'

const SESSIONS_DIR = path.join(process.cwd(), 'sessions')

export class ChatEngine {
  private currentPersonality: Personality | null = null
  private messages: ChatMessage[] = []

  // 加载人格
  loadPersonality(slug: string): boolean {
    const personality = creator.get(slug)
    if (!personality) {
      console.log(`[chat] 找不到人格: ${slug}`)
      return false
    }

    this.currentPersonality = personality
    this.messages = []
    console.log(`[chat] 已加载人格: ${personality.name}`)
    return true
  }

  // 生成回复
  async generateReply(userMessage: string): Promise<string> {
    if (!this.currentPersonality) {
      return '请先加载一个人格'
    }

    // 记录用户消息
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    })

    // 根据人格生成回复
    const reply = this.constructReply(userMessage)

    // 记录AI回复
    this.messages.push({
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
    })

    return reply
  }

  // 构建回复
  private constructReply(userMessage: string): string {
    const p = this.currentPersonality!
    const layer2 = p.partB.layer2
    const layer3 = p.partB.layer3

    // 检查是否是命令
    if (userMessage.startsWith('/')) {
      return this.handleCommand(userMessage)
    }

    // 根据消息内容选择回复策略
    let reply = ''

    // 问候
    if (this.isGreeting(userMessage)) {
      reply = this.getRandomItem(['你好', '嗨', '嗯', '咋了'])
    }
    // 问想不想
    else if (userMessage.includes('想') || userMessage.includes('念')) {
      reply = this.getRandomItem(['嗯', '你猜', '不知道', '我也是呀'])
    }
    // 问在干嘛
    else if (userMessage.includes('干嘛') || userMessage.includes('做啥')) {
      reply = this.getRandomItem([
        '没干嘛',
        '在玩手机',
        '刚吃完饭',
        '在刷视频',
      ])
    }
    // 晚安
    else if (userMessage.includes('晚安') || userMessage.includes('睡')) {
      reply = this.getRandomItem(['晚安', '嗯，睡吧', '早点睡'])
    }
    // 默认回复
    else {
      // 使用人格的口头禅
      if (layer2.catchphrases.length > 0) {
        reply = this.getRandomItem(layer2.catchphrases)
      } else {
        reply = this.getRandomItem([
          '嗯',
          '哦',
          '好',
          '知道了',
          '是吗',
          '然后呢',
        ])
      }
    }

    // 添加语气词
    if (layer2.fillerWords.length > 0 && Math.random() > 0.7) {
      reply += this.getRandomItem(layer2.fillerWords)
    }

    return reply
  }

  // 处理命令
  private handleCommand(command: string): string {
    const cmd = command.split(' ')[0].toLowerCase()

    switch (cmd) {
      case '/help':
        return [
          '可用命令:',
          '/help - 显示帮助',
          '/status - 查看状态',
          '/clear - 清除历史',
          '/quit - 退出聊天',
        ].join('\n')

      case '/status':
        return [
          `人格: ${this.currentPersonality?.name}`,
          `消息数: ${this.messages.length}`,
        ].join('\n')

      case '/clear':
        this.messages = []
        return '历史已清除'

      case '/quit':
        return '再见!'

      default:
        return `未知命令: ${cmd}`
    }
  }

  // 判断是否是问候
  private isGreeting(message: string): boolean {
    const greetings = ['你好', 'hi', 'hello', '嗨', '在吗', '喂']
    return greetings.some(g => message.toLowerCase().includes(g))
  }

  // 随机获取数组元素
  private getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  // 保存会话
  saveSession(): void {
    if (!this.currentPersonality || this.messages.length === 0) return

    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true })
    }

    const session: ChatSession = {
      personalitySlug: this.currentPersonality.slug,
      messages: this.messages,
      createdAt: new Date().toISOString(),
    }

    const filename = `${this.currentPersonality.slug}-${Date.now()}.json`
    fs.writeFileSync(path.join(SESSIONS_DIR, filename), JSON.stringify(session, null, 2))
    console.log(`[chat] 会话已保存: ${filename}`)
  }

  // 获取当前人格
  getPersonality(): Personality | null {
    return this.currentPersonality
  }

  // 获取消息历史
  getMessages(): ChatMessage[] {
    return this.messages
  }
}

export const chatEngine = new ChatEngine()
