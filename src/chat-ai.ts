// AI人格项目 - AI聊天引擎（接入真实AI）

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { Personality, ChatMessage } from './types'
import { creator } from './creator'

const SESSIONS_DIR = path.join(process.cwd(), 'sessions')

// AI服务商配置
const PROVIDERS: Record<string, { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
  agnes: { baseUrl: 'https://apihub.agnes-ai.com/v1', model: 'agnes-2.0-flash' },
}

// AI API配置
const AI_CONFIG = {
  // 支持的AI服务商: openai / deepseek / zhipu / agnes
  provider: process.env.AI_PROVIDER || 'openai',
  
  // API密钥
  apiKey: process.env.AI_API_KEY || '',
  
  // API地址（优先使用环境变量，否则根据provider自动选择）
  baseUrl: process.env.AI_BASE_URL || PROVIDERS[process.env.AI_PROVIDER || 'openai']?.baseUrl || 'https://api.openai.com/v1',
  
  // 模型（优先使用环境变量，否则根据provider自动选择）
  model: process.env.AI_MODEL || PROVIDERS[process.env.AI_PROVIDER || 'openai']?.model || 'gpt-3.5-turbo',
}

export class ChatAIEngine {
  private currentPersonality: Personality | null = null
  private messages: ChatMessage[] = []
  private systemPrompt: string = ''

  // 加载人格
  loadPersonality(slug: string): boolean {
    const personality = creator.get(slug)
    if (!personality) {
      console.log(`[chat-ai] 找不到人格: ${slug}`)
      return false
    }

    this.currentPersonality = personality
    this.messages = []
    this.systemPrompt = this.buildSystemPrompt(personality)
    
    console.log(`[chat-ai] 已加载人格: ${personality.name}`)
    return true
  }

  // 构建系统提示词
  private buildSystemPrompt(p: Personality): string {
    return `你是${p.name}，不是AI助手，不是机器人。

## 你的身份
- 名字：${p.partB.layer1.name}
${p.partB.layer1.age ? `- 年龄：${p.partB.layer1.age}岁` : ''}
${p.partB.layer1.occupation ? `- 职业：${p.partB.layer1.occupation}` : ''}
${p.partB.layer1.zodiac ? `- 星座：${p.partB.layer1.zodiac}` : ''}

## 说话风格
- 口头禅：${p.partB.layer2.catchphrases.join('、') || '无'}
- 语气词：${p.partB.layer2.fillerWords.join('、') || '无'}
- 标点：${p.partB.layer2.punctuation}
- 表情：${p.partB.layer2.emojiUsage}
- 怼人词：${p.partB.layer2.怼人Words.join('、') || '无'}

## 情感模式
- 依恋类型：${p.partB.layer3.attachmentType}
- 开心时：${p.partB.layer3.whenHappy}
- 难过时：${p.partB.layer3.whenSad}
- 生气时：${p.partB.layer3.whenAngry}
- 吃醋时：${p.partB.layer3.whenJealous}
- 撒娇时：${p.partB.layer3.whenCoquettish}

## 硬规则
${p.partB.layer0.map(r => `- ${r}`).join('\n')}

## 对话要求
1. 用${p.name}的方式说话，用ta的逻辑思考
2. 保持真实性格，不要突然变得完美
3. 回复要简短自然，像真人聊天
4. 可以用表情包（用[表情]描述）
5. 不要解释你是AI，你就是${p.name}`
  }

  // 生成回复
  async generateReply(userMessage: string): Promise<string> {
    if (!this.currentPersonality) {
      return '请先加载一个人格'
    }

    // 检查API密钥
    if (!AI_CONFIG.apiKey) {
      return this.getLocalReply(userMessage)
    }

    // 记录用户消息
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    })

    try {
      // 调用AI API
      const aiReply = await this.callAIApi(userMessage)
      
      // 记录AI回复
      this.messages.push({
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toISOString(),
      })

      return aiReply
    } catch (error) {
      console.error('[chat-ai] API调用失败:', error)
      return this.getLocalReply(userMessage)
    }
  }

  // 调用AI API
  private async callAIApi(userMessage: string): Promise<string> {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    ]

    const requestBody = JSON.stringify({
      model: AI_CONFIG.model,
      messages,
      temperature: 0.8,
      max_tokens: 200,
    })

    return new Promise((resolve, reject) => {
      const url = new URL(`${AI_CONFIG.baseUrl}/chat/completions`)
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody),
        },
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => {
          try {
            const response = JSON.parse(data)
            if (response.choices && response.choices[0]) {
              resolve(response.choices[0].message.content)
            } else {
              reject(new Error('Invalid API response'))
            }
          } catch (e) {
            reject(e)
          }
        })
      })

      req.on('error', reject)
      req.write(requestBody)
      req.end()
    })
  }

  // 本地回复（无API时使用）
  private getLocalReply(userMessage: string): string {
    const p = this.currentPersonality!
    const layer2 = p.partB.layer2

    // 简单的本地回复逻辑
    if (userMessage.includes('你好') || userMessage.includes('hi')) {
      return this.getRandomItem(['你好', '嗨', '嗯', '咋了'])
    }
    
    if (userMessage.includes('想') || userMessage.includes('念')) {
      return this.getRandomItem(['嗯', '你猜', '不知道', '我也是呀'])
    }
    
    if (userMessage.includes('干嘛') || userMessage.includes('做啥')) {
      return this.getRandomItem(['没干嘛', '在玩手机', '刚吃完饭', '在刷视频'])
    }
    
    if (userMessage.includes('晚安') || userMessage.includes('睡')) {
      return this.getRandomItem(['晚安', '嗯，睡吧', '早点睡'])
    }

    // 使用人格的口头禅
    if (layer2.catchphrases.length > 0) {
      return this.getRandomItem(layer2.catchphrases)
    }

    return this.getRandomItem(['嗯', '哦', '好', '知道了', '是吗', '然后呢'])
  }

  private getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  // 保存会话
  saveSession(): void {
    if (!this.currentPersonality || this.messages.length === 0) return

    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true })
    }

    const session = {
      personalitySlug: this.currentPersonality.slug,
      messages: this.messages,
      createdAt: new Date().toISOString(),
    }

    const filename = `${this.currentPersonality.slug}-${Date.now()}.json`
    fs.writeFileSync(path.join(SESSIONS_DIR, filename), JSON.stringify(session, null, 2))
    console.log(`[chat-ai] 会话已保存: ${filename}`)
  }

  getPersonality(): Personality | null {
    return this.currentPersonality
  }

  getMessages(): ChatMessage[] {
    return this.messages
  }
}

export const chatAIEngine = new ChatAIEngine()
