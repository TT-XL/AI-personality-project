// AI人格项目 - 拉黑/删除系统（真实版）

import * as fs from 'fs'
import * as path from 'path'

const BLOCK_DIR = path.join(process.cwd(), 'blocks')

export interface BlockData {
  slug: string
  isBlocked: boolean
  isDeleted: boolean
  isPermanentlyDeleted: boolean  // 彻底删除
  disgustLevel: number  // 0-100，反感程度
  blockReason: string
  blockTime: string
  deleteTime: string
  familiarLevel: number  // 0-100，熟悉程度
  lastChatTime: string
  chatCount: number
}

export class Blocker {
  private data: BlockData | null = null
  private slug: string = ''

  // 加载拉黑数据
  load(slug: string): void {
    this.slug = slug
    
    if (!fs.existsSync(BLOCK_DIR)) {
      fs.mkdirSync(BLOCK_DIR, { recursive: true })
    }

    const filePath = path.join(BLOCK_DIR, `${slug}.json`)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      this.data = JSON.parse(content)
    } else {
      this.data = {
        slug,
        isBlocked: false,
        isDeleted: false,
        isPermanentlyDeleted: false,
        disgustLevel: 0,
        blockReason: '',
        blockTime: '',
        deleteTime: '',
        familiarLevel: 0,
        lastChatTime: '',
        chatCount: 0,
      }
    }
  }

  // 保存拉黑数据
  save(): void {
    if (!this.data) return

    if (!fs.existsSync(BLOCK_DIR)) {
      fs.mkdirSync(BLOCK_DIR, { recursive: true })
    }

    const filePath = path.join(BLOCK_DIR, `${this.slug}.json`)
    fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2))
  }

  // 增加熟悉程度
  increaseFamiliarity(amount: number): void {
    if (!this.data) return
    
    this.data.familiarLevel = Math.min(100, this.data.familiarLevel + amount)
    this.data.chatCount++
    this.data.lastChatTime = new Date().toISOString()
    this.save()
  }

  // 增加反感程度
  increaseDisgust(amount: number, reason: string): void {
    if (!this.data) return
    
    this.data.disgustLevel = Math.min(100, this.data.disgustLevel + amount)
    this.data.blockReason = reason
    this.save()
    
    // 根据反感程度决定行为
    if (this.data.disgustLevel >= 80) {
      this.block('永久拉黑')
    } else if (this.data.disgustLevel >= 50) {
      this.block('暂时拉黑')
    }
  }

  // 拉黑
  block(reason: string): void {
    if (!this.data) return
    
    this.data.isBlocked = true
    this.data.blockReason = reason
    this.data.blockTime = new Date().toISOString()
    this.save()
  }

  // 删除好友（彻底删除）
  deletePermanently(): void {
    if (!this.data) return
    
    this.data.isDeleted = true
    this.data.isPermanentlyDeleted = true
    this.data.blockReason = '彻底删除'
    this.data.deleteTime = new Date().toISOString()
    this.save()
    
    // 删除文件
    const filePath = path.join(BLOCK_DIR, `${this.slug}.json`)
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }
  }

  // 删除好友（保留数据）
  deleteTemporarily(): void {
    if (!this.data) return
    
    this.data.isDeleted = true
    this.data.blockReason = '删除好友'
    this.data.deleteTime = new Date().toISOString()
    this.save()
  }

  // 解除拉黑（人格主动加回来）
  unblockByPersonality(): void {
    if (!this.data) return
    
    this.data.isBlocked = false
    this.data.isDeleted = false
    this.data.disgustLevel = Math.max(0, this.data.disgustLevel - 50)
    this.save()
  }

  // 用户尝试添加（被拒绝）
  rejectAdd(): { success: boolean; message: string } {
    if (!this.data) {
      return { success: false, message: '无数据' }
    }
    
    // 刚加上没多久就被删除，100%不通过
    if (this.data.chatCount <= 3) {
      return { 
        success: false, 
        message: '不通过' 
      }
    }
    
    // 比较熟悉，有概率通过
    if (this.data.familiarLevel >= 50) {
      // 概率通过
      const passChance = this.data.familiarLevel / 100
      if (Math.random() < passChance) {
        // 通过，但人格还生气
        this.data.isBlocked = false
        this.data.isDeleted = false
        this.data.disgustLevel = Math.max(30, this.data.disgustLevel - 20)
        this.save()
        return { 
          success: true, 
          message: '通过，但人格还生气' 
        }
      }
    }
    
    // 不通过
    return { 
      success: false, 
      message: '不通过' 
    }
  }

  // 用户尝试添加（被彻底拒绝）
  rejectPermanently(): void {
    if (!this.data) return
    
    // 彻底删除
    this.deletePermanently()
  }

  // 减少反感
  decreaseDisgust(amount: number): void {
    if (!this.data) return
    
    this.data.disgustLevel = Math.max(0, this.data.disgustLevel - amount)
    this.save()
  }

  // 检查是否被拉黑
  isBlocked(): boolean {
    return this.data?.isBlocked || false
  }

  // 检查是否被删除
  isDeleted(): boolean {
    return this.data?.isDeleted || false
  }

  // 检查是否被彻底删除
  isPermanentlyDeleted(): boolean {
    return this.data?.isPermanentlyDeleted || false
  }

  // 获取拉黑状态
  getStatus(): string {
    if (!this.data) return '正常'
    
    if (this.data.isPermanentlyDeleted) {
      return '已彻底删除'
    }
    
    if (this.data.isDeleted) {
      return '已删除好友'
    }
    
    if (this.data.isBlocked) {
      return `已拉黑 (${this.data.blockReason})`
    }
    
    if (this.data.disgustLevel > 0) {
      return `反感程度: ${this.data.disgustLevel}/100`
    }
    
    return '正常'
  }

  // 获取反感程度
  getDisgustLevel(): number {
    return this.data?.disgustLevel || 0
  }

  // 获取拉黑消息
  getBlockMessage(): string {
    if (!this.data) return ''
    
    if (this.data.isPermanentlyDeleted) {
      return '对方已彻底删除你，无法恢复。'
    }
    
    if (this.data.isDeleted) {
      return '对方已删除你的好友。'
    }
    
    if (this.data.isBlocked) {
      return '对方已拉黑你。'
    }
    
    return ''
  }

  // 检查是否应该拉黑（只检查，不修改状态）
  shouldBlock(message: string): boolean {
    if (!this.data) return false
    
    const lowerMessage = message.toLowerCase()
    
    // 骚扰行为
    if (lowerMessage.includes('约吗') || lowerMessage.includes('约不') || lowerMessage.includes('出来玩')) {
      return true
    }
    
    // 色情内容
    if (lowerMessage.includes('色') || lowerMessage.includes('骚') || lowerMessage.includes('约炮')) {
      return true
    }
    
    // 威胁
    if (lowerMessage.includes('杀') || lowerMessage.includes('死') || lowerMessage.includes('打')) {
      return true
    }
    
    return false
  }

  // 处理拉黑逻辑（增加反感程度）
  processBlock(message: string): void {
    if (!this.data) return
    
    const lowerMessage = message.toLowerCase()
    
    // 骚扰行为
    if (lowerMessage.includes('约吗') || lowerMessage.includes('约不') || lowerMessage.includes('出来玩')) {
      this.increaseDisgust(20, '骚扰')
      return
    }
    
    // 色情内容
    if (lowerMessage.includes('色') || lowerMessage.includes('骚') || lowerMessage.includes('约炮')) {
      this.increaseDisgust(30, '色情骚扰')
      return
    }
    
    // 威胁
    if (lowerMessage.includes('杀') || lowerMessage.includes('死') || lowerMessage.includes('打')) {
      this.increaseDisgust(50, '威胁')
      return
    }
    
    // 反复骚扰（只有在已经有反感的情况下才增加）
    if (this.data.disgustLevel >= 30) {
      this.increaseDisgust(10, '反复骚扰')
    }
  }

  // 获取骂人消息
  getScoldMessage(): string {
    const scoldMessages = [
      '你有病吧',
      '神经病',
      '滚',
      '卧槽你是不是有病',
      '傻逼吧你',
      '脑子有坑',
      '有毛病',
      '你脑子没问题吧',
      '啥玩意',
      '有大病',
      '滚啊',
      '你谁啊，有病吧',
      '有完没完',
      '烦不烦',
      '闭嘴',
      '有病',
      '脑子进水了',
      '有毛病吧',
      '神经',
      '有病吧你',
      '滚蛋',
      '少烦我',
      '有完没完了',
      '你是不是有病',
      '有大病吧',
      '脑子有泡',
      '有毛病啊',
      '滚远点',
      '有病啊',
    ]
    return scoldMessages[Math.floor(Math.random() * scoldMessages.length)]
  }

  // 检查是否可以重新添加
  canBeReadded(): boolean {
    if (!this.data) return false
    
    // 如果没有被拉黑/删除，不需要重新添加
    if (!this.data.isBlocked && !this.data.isDeleted) {
      return false
    }
    
    // 如果是永久删除，不能重新添加
    if (this.data.isPermanentlyDeleted) {
      return false
    }
    
    // 如果反感程度很高，不能重新添加
    if (this.data.disgustLevel >= 80) {
      return false
    }
    
    return true
  }

  // 尝试重新添加
  tryReadd(): { success: boolean; message: string } {
    if (!this.data) {
      return { success: false, message: '无数据' }
    }
    
    // 如果没有被拉黑/删除
    if (!this.data.isBlocked && !this.data.isDeleted) {
      return { success: false, message: '没有被拉黑/删除' }
    }
    
    // 如果是永久删除
    if (this.data.isPermanentlyDeleted) {
      return { success: false, message: '已被彻底删除，无法恢复' }
    }
    
    // 如果反感程度很高
    if (this.data.disgustLevel >= 80) {
      return { success: false, message: '还是很生气，不想加回来' }
    }
    
    // 重新添加
    this.unblockByPersonality()
    
    // 根据反感程度返回不同消息
    if (this.data.disgustLevel < 20) {
      return { success: true, message: '好吧，再给你一次机会' }
    } else if (this.data.disgustLevel < 40) {
      return { success: true, message: '行吧，再聊聊看' }
    } else {
      return { success: true, message: '哼，别再让我失望了' }
    }
  }

  // 随机决定行为
  getRandomAction(message: string): { action: 'scold' | 'block' | 'delete' | 'ignore'; message: string } {
    const random = Math.random()
    
    // 根据反感程度决定行为
    if (this.data && this.data.disgustLevel >= 80) {
      // 很生气，可能直接删除
      if (random < 0.3) {
        // 30% 直接删除
        return { action: 'delete', message: this.getScoldMessage() }
      } else if (random < 0.7) {
        // 40% 骂完删除
        return { action: 'scold', message: this.getScoldMessage() }
      } else {
        // 30% 只拉黑
        return { action: 'block', message: this.getScoldMessage() }
      }
    } else if (this.data && this.data.disgustLevel >= 50) {
      // 生气了，可能拉黑
      if (random < 0.5) {
        // 50% 骂完拉黑
        return { action: 'scold', message: this.getScoldMessage() }
      } else {
        // 50% 只拉黑
        return { action: 'block', message: this.getScoldMessage() }
      }
    } else if (this.data && this.data.disgustLevel >= 30) {
      // 有点烦，可能骂人
      if (random < 0.4) {
        // 40% 骂人
        return { action: 'scold', message: this.getScoldMessage() }
      } else {
        // 60% 忽略
        return { action: 'ignore', message: '' }
      }
    } else if (this.data && this.data.disgustLevel >= 10) {
      // 轻微反感，已读不回
      return { action: 'ignore', message: '' }
    }
    
    // 正常情况，忽略
    return { action: 'ignore', message: '' }
  }

  // 检查是否应该删除好友
  shouldDelete(): boolean {
    if (!this.data) return false
    return this.data.disgustLevel >= 80
  }

  // 检查是否应该彻底删除
  shouldDeletePermanently(): boolean {
    if (!this.data) return false
    return this.data.disgustLevel >= 90
  }

  // 清除所有数据
  clear(): void {
    this.data = {
      slug: this.slug,
      isBlocked: false,
      isDeleted: false,
      isPermanentlyDeleted: false,
      disgustLevel: 0,
      blockReason: '',
      blockTime: '',
      deleteTime: '',
      familiarLevel: 0,
      lastChatTime: '',
      chatCount: 0,
    }
    this.save()
  }
}

export const blocker = new Blocker()
