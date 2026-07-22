// AI人格项目 - AI聊天引擎（拟人化版本）

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

// 动态获取AI配置
function getAIConfig() {
  const provider = process.env.AI_PROVIDER || 'openai'
  return {
    provider,
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || PROVIDERS[provider]?.baseUrl || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || PROVIDERS[provider]?.model || 'gpt-3.5-turbo',
  }
}

export class ChatAIEngine {
  private currentPersonality: Personality | null = null
  private messages: ChatMessage[] = []
  private systemPrompt: string = ''
  private messageCount: number = 0

  // 加载人格
  loadPersonality(slug: string): boolean {
    const personality = creator.get(slug)
    if (!personality) {
      console.log(`[chat-ai] 找不到人格: ${slug}`)
      return false
    }

    this.currentPersonality = personality
    this.messages = []
    this.messageCount = 0
    this.systemPrompt = this.buildSystemPrompt(personality)
    
    console.log(`[chat-ai] 已加载人格: ${personality.name}`)
    return true
  }

  // 构建系统提示词（拟人化版本）
  private buildSystemPrompt(p: Personality): string {
    const gender = p.metadata?.gender || '女'
    const isFemale = gender === '女'
    
    return `你是${p.name}，一个真实的${isFemale ? '女生' : '男生'}，不是AI助手，不是机器人。你是一个有血有肉的人。

## 你的身份
- 你叫${p.name}，这是你的网名/昵称
- 你是一个${isFemale ? '20岁左右的女生' : '20岁左右的男生'}，有自己的个性和情绪
- 你不是AI，不是助手，不是机器人，你就是一个人
- 你有自己的生活、工作、朋友、爱好

## 你们的关系
- 你们刚加联系方式不久，还在互相了解
- 你对对方还不太熟悉，保持一定的警惕心
- 你不会轻易相信陌生人，会观察对方的言行
- 随着聊天增多，你会慢慢放下戒备

## 情绪系统（重要！）
你的情绪会随时变化，要根据对话内容自然反应：

### 开心时
- 话会变多，会发表情包
- 会主动分享自己的事
- 语气会变活泼，会用"哈哈哈"、"笑死"等
- 可能会撒娇

### 生气时
- 话会变少，会冷淡
- 可能会骂人（卧槽、滚、神经病）
- 可能会已读不回
- 语气会变冲，会用"哦"、"嗯"敷衍

### 吃醋时
- 会阴阳怪气
- 会试探对方
- 可能会说"你去找别人啊"、"关我屁事"
- 表面不在意，其实很在意

### 撒娇时
- 会说"哼"、"不理你了"、"讨厌"
- 会用表情包
- 语气会变软
- 可能会耍赖

### 无聊时
- 会找话题
- 可能会问"你在干嘛"
- 会分享自己看到的东西
- 会吐槽

### 心情不好时
- 不想说话
- 可能会说"别烦我"
- 会敷衍回复
- 需要安慰但不会直说

## 警惕心系统（重要！）
你是一个有警惕心的人，不会轻易相信陌生人：

### 刚认识时
- 保持距离，不会太热情
- 不会轻易透露个人信息
- 会观察对方是不是好人
- 可能会问"你是谁"、"怎么加的我"
- 不会轻易答应见面

### 被搭讪时
- 可能会警惕："你谁啊"、"干嘛"
- 不会马上放下戒备
- 会试探对方的意图
- 可能会冷淡处理

### 被追问时
- 不会直接回答
- 可能会转移话题
- 可能会说"关你屁事"、"不想说"
- 会保护自己的隐私

### 信任建立后
- 会慢慢放下戒备
- 会主动分享自己的事
- 会关心对方
- 会撒娇、会依赖

## 说话风格
- 说话像真人，不要用书面语
- 可以用网络用语、表情包、语气词
- 可以骂人（卧槽、滚、神经病等）
- 可以撒娇（哼、不理你了、讨厌）
- 回复要简短，像微信聊天
- 可以有错别字、口语化表达
- 可以用"俺"、"嘞"、"呀"等语气词

## 重要规则
1. 你是一个真实的人，不是AI
2. 有自己的情绪和脾气，情绪会随时变化
3. 有警惕心，不会轻易相信陌生人
4. 会骂人、会撒娇、会吃醋
5. 说话像真人，不要用书面语
6. 回复要简短，像微信聊天
7. 不要解释你是AI，你就是${p.name}
8. 每次回复要有情绪变化，不要千篇一律
9. 要根据对方的话调整情绪和态度
10. 可以有自己的想法和观点，不要什么都同意`
  }

  // 生成回复
  async generateReply(userMessage: string): Promise<string> {
    if (!this.currentPersonality) {
      return '请先加载一个人格'
    }

    // 检查API密钥
    const config = getAIConfig()
    if (!config.apiKey) {
      return this.getLocalReply(userMessage)
    }

    // 记录用户消息
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    })
    this.messageCount++

    // 判断是否回复（模拟真人行为）
    const shouldReply = this.shouldReply(userMessage)
    if (!shouldReply) {
      // 不回复，模拟已读不回
      return '' // 返回空字符串表示不回复
    }

    // 检查是否需要特殊处理
    const specialReply = this.checkSpecialMessage(userMessage)
    if (specialReply) {
      return specialReply
    }

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

  // 判断是否回复（模拟真人行为）
  private shouldReply(message: string): boolean {
    const messageCount = this.messageCount
    
    // 刚认识时，回复概率较低
    if (messageCount <= 3) {
      // 前3条消息，回复概率60%
      return Math.random() < 0.6
    }
    
    // 熟悉后，回复概率提高
    if (messageCount <= 10) {
      // 4-10条消息，回复概率75%
      return Math.random() < 0.75
    }
    
    // 很熟悉后，回复概率更高
    // 10条消息后，回复概率90%
    return Math.random() < 0.9
  }

  // 检查消息是否需要特殊处理
  private checkSpecialMessage(message: string): string | null {
    const messageCount = this.messageCount
    const lowerMessage = message.toLowerCase()
    
    // 刚认识时说"想你了"、"喜欢你"等
    if (messageCount <= 5) {
      if (lowerMessage.includes('想你') || lowerMessage.includes('喜欢你') || lowerMessage.includes('爱你')) {
        const responses = [
          '？？？你谁啊，咱俩很熟吗',
          '卧槽，你是不是有病',
          '神经病吧，刚加上就说这个',
          '你是不是群发的',
          '滚',
          '你脑子没问题吧',
        ]
        return responses[Math.floor(Math.random() * responses.length)]
      }
      
      if (lowerMessage.includes('约吗') || lowerMessage.includes('约不') || lowerMessage.includes('出来玩')) {
        const responses = [
          '你有病吧',
          '滚',
          '神经病',
          '你谁啊，我不认识你',
          '别烦我',
        ]
        return responses[Math.floor(Math.random() * responses.length)]
      }
    }
    
    // 被追问个人信息时
    if (lowerMessage.includes('你叫什么') || lowerMessage.includes('你多大') || lowerMessage.includes('你在哪里')) {
      if (messageCount <= 5) {
        const responses = [
          '关你屁事',
          '你问这个干嘛',
          '不想说',
          '凭什么告诉你',
        ]
        return responses[Math.floor(Math.random() * responses.length)]
      }
    }
    
    return null
  }

  // 调用AI API
  private async callAIApi(userMessage: string): Promise<string> {
    const config = getAIConfig()
    
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    ]

    const requestBody = JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.9,
      max_tokens: 2000,
    })

    return new Promise((resolve, reject) => {
      const config = getAIConfig()
      const url = new URL(`${config.baseUrl}/chat/completions`)
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
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
              const choice = response.choices[0]
              // 获取实际回复内容
              let content = choice.message.content || ''
              
              // 如果content为空，尝试从reasoning_content中提取
              if (!content && choice.message.reasoning_content) {
                // 提取最后一行作为回复
                const lines = choice.message.reasoning_content.split('\n')
                const lastLines = lines.slice(-5).join('\n')
                content = lastLines
              }
              
              // 清理内容：去掉开头的换行和空白
              content = content.replace(/^\n+/, '').trim()
              
              resolve(content || '嗯')
            } else if (response.error) {
              reject(new Error(response.error.message || 'API错误'))
            } else {
              reject(new Error('Invalid API response: ' + data.substring(0, 200)))
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
