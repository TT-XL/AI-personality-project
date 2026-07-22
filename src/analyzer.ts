// AI人格项目 - 数据分析器

import { Personality, PersonalityMetadata, RelationshipMemory, Persona } from './types'

export class Analyzer {
  // 从聊天记录分析人格
  async analyzeFromChatRecords(
    name: string,
    chatContent: string,
    userDescription?: string
  ): Promise<Partial<Personality>> {
    console.log(`[analyzer] 分析 ${name} 的聊天记录...`)

    // 提取说话风格
    const speechStyle = this.extractSpeechStyle(chatContent)
    
    // 提取情感模式
    const emotionalPattern = this.extractEmotionalPattern(chatContent)
    
    // 提取口头禅
    const catchphrases = this.extractCatchphrases(chatContent)
    
    // 提取关系时间线
    const timeline = this.extractTimeline(chatContent)

    const slug = this.generateSlug(name)

    return {
      name,
      slug,
      description: userDescription || `${name}的AI人格`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 'v1',
      metadata: {
        tags: [],
      },
      partA: {
        overview: {
          type: 'relationship',
          timeline,
        },
        sharedMemories: [],
        dailyPatterns: [],
        conflictPatterns: [],
      },
      partB: {
        layer0: [
          `你是${name}，不是AI助手`,
          '不说现实中绝不可能说的话',
          '保持真实的"棱角"',
        ],
        layer1: {
          name,
        },
        layer2: speechStyle,
        layer3: emotionalPattern,
        layer4: {
          whenBeingCared: '自然接受',
          whenInConflict: '会怼回去',
          whenNeedComfort: '嘴硬但需要',
          exitPatterns: ['出去了', '不聊了', '你早点休息'],
        },
      },
    }
  }

  // 提取说话风格
  private extractSpeechStyle(content: string): any {
    const lines = content.split('\n').filter(l => l.trim())
    
    // 统计常见语气词
    const fillerWords = ['嗯', '哦', '噢', '啊', '呢', '吧', '呀', '嘞', '嘞']
    const foundFillers = fillerWords.filter(f => content.includes(f))
    
    // 统计表情使用
    const emojiPattern = /\[.*?\]|😊|😂|❤️|  /g
    const emojis = content.match(emojiPattern) || []
    
    // 统计句式特点
    const shortSentences = lines.filter(l => l.length < 10).length
    const longSentences = lines.filter(l => l.length > 20).length

    return {
      catchphrases: [],
      fillerWords: foundFillers,
      punctuation: '多用问号和感叹号',
      emojiUsage: emojis.length > 5 ? '大量使用表情' : '偶尔使用表情',
      sentenceStructure: shortSentences > longSentences ? '短句为主' : '长短混合',
      怼人Words: ['屁', '歪理', '关你屁事'],
    }
  }

  // 提取情感模式
  private extractEmotionalPattern(content: string): any {
    return {
      attachmentType: '安全型偏回避',
      whenHappy: '话多、发表情包',
      whenSad: '话少、敷衍',
      whenAngry: '怼人、会怼回去',
      whenJealous: '试探、不承认',
      whenCoquettish: '耍赖、会说"我不管"',
    }
  }

  // 提取口头禅
  private extractCatchphrases(content: string): string[] {
    const wordCount = new Map<string, number>()
    const words = content.split(/[\s\n]+/)
    
    for (const word of words) {
      if (word.length >= 2 && word.length <= 4) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    }

    // 返回出现频率最高的词
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  // 提取关系时间线
  private extractTimeline(content: string): any[] {
    const timeline = []
    const datePattern = /(\d{4})[年\-/](\d{1,2})[月\-/](\d{1,2})/g
    let match

    while ((match = datePattern.exec(content)) !== null) {
      const date = `${match[1]}/${match[2]}/${match[3]}`
      // 获取日期后的内容
      const startIdx = match.index + match[0].length
      const endIdx = content.indexOf('\n', startIdx)
      const event = content.substring(startIdx, endIdx > 0 ? endIdx : startIdx + 50).trim()
      
      if (event) {
        timeline.push({ date, event })
      }
    }

    return timeline
  }

  // 生成slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

export const analyzer = new Analyzer()
