// AI人格项目 - 拉黑/删除系统

import * as fs from 'fs'
import * as path from 'path'

const BLOCK_DIR = path.join(process.cwd(), 'blocks')

export interface BlockData {
  slug: string
  isBlocked: boolean
  isDeleted: boolean
  disgustLevel: number  // 0-100，反感程度
  blockReason: string
  blockTime: string
  canUnblock: boolean   // 是否可能被加回来
  unblockCondition: string  // 加回来的条件
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
        disgustLevel: 0,
        blockReason: '',
        blockTime: '',
        canUnblock: false,
        unblockCondition: '',
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
    } else if (this.data.disgustLevel >= 30) {
      // 只是不回复
    }
  }

  // 拉黑
  block(reason: string): void {
    if (!this.data) return
    
    this.data.isBlocked = true
    this.data.blockReason = reason
    this.data.blockTime = new Date().toISOString()
    this.data.canUnblock = this.data.disgustLevel < 80
    this.data.unblockCondition = this.data.disgustLevel < 80 ? '过段时间可能加回来' : '永久拉黑'
    this.save()
  }

  // 删除好友
  deleteFriend(): void {
    if (!this.data) return
    
    this.data.isDeleted = true
    this.data.isBlocked = true
    this.data.blockReason = '删除好友'
    this.data.blockTime = new Date().toISOString()
    this.data.canUnblock = this.data.disgustLevel < 60
    this.data.unblockCondition = this.data.disgustLevel < 60 ? '可能被加回来' : '不会加回来'
    this.save()
  }

  // 解除拉黑（加回来）
  unblock(): void {
    if (!this.data) return
    
    if (!this.data.canUnblock) {
      return // 不能加回来
    }
    
    this.data.isBlocked = false
    this.data.isDeleted = false
    this.data.disgustLevel = Math.max(0, this.data.disgustLevel - 30) // 减少反感
    this.save()
  }

  // 减少反感
  decreaseDisgust(amount: number): void {
    if (!this.data) return
    
    this.data.disgustLevel = Math.max(0, this.data.disgustLevel - amount)
    this.save()
  }

  // 检查是否可以被加回来
  canBeReadded(): boolean {
    if (!this.data) return false
    
    // 如果没有被拉黑/删除，不需要加回来
    if (!this.data.isBlocked && !this.data.isDeleted) {
      return false
    }
    
    // 如果是永久拉黑，不能加回来
    if (this.data.disgustLevel >= 80) {
      return false
    }
    
    // 如果反感程度降到30以下，可以加回来
    return this.data.disgustLevel < 30
  }

  // 检查时间是否足够长
  isTimeEnough(): boolean {
    if (!this.data || !this.data.blockTime) return false
    
    const blockTime = new Date(this.data.blockTime).getTime()
    const now = Date.now()
    const daysSinceBlock = (now - blockTime) / (1000 * 60 * 60 * 24)
    
    // 暂时拉黑：3天后可能加回来
    // 删除好友：7天后可能加回来
    if (this.data.isDeleted) {
      return daysSinceBlock >= 7
    }
    
    return daysSinceBlock >= 3
  }

  // 尝试加回来
  tryReadd(): { success: boolean; message: string } {
    if (!this.data) {
      return { success: false, message: '无数据' }
    }
    
    // 如果没有被拉黑/删除
    if (!this.data.isBlocked && !this.data.isDeleted) {
      return { success: false, message: '没有被拉黑/删除' }
    }
    
    // 如果是永久拉黑
    if (this.data.disgustLevel >= 80) {
      return { success: false, message: '已被永久拉黑，无法加回来' }
    }
    
    // 检查时间
    if (!this.isTimeEnough()) {
      return { success: false, message: '时间还不够，再等等' }
    }
    
    // 检查反感程度
    if (this.data.disgustLevel >= 30) {
      return { success: false, message: '还是很生气，不想加回来' }
    }
    
    // 可以加回来
    this.unblock()
    return { success: true, message: '好吧，再给你一次机会' }
  }

  // 用户道歉
  acceptApology(): { success: boolean; message: string } {
    if (!this.data) {
      return { success: false, message: '无数据' }
    }
    
    // 如果没有被拉黑/删除
    if (!this.data.isBlocked && !this.data.isDeleted) {
      return { success: false, message: '没有被拉黑/删除' }
    }
    
    // 如果是永久拉黑
    if (this.data.disgustLevel >= 80) {
      return { success: false, message: '太晚了，不想听' }
    }
    
    // 道歉减少反感
    this.decreaseDisgust(20)
    
    // 检查是否可以加回来
    if (this.data.disgustLevel < 30) {
      this.unblock()
      return { success: true, message: '行吧，再给你一次机会' }
    }
    
    return { success: false, message: '还是很生气，再等等' }
  }

  // 获取加回来的消息
  getReaddMessage(): string {
    if (!this.data) return ''
    
    if (this.data.disgustLevel < 10) {
      return '算了，再给你一次机会吧。别再让我失望了。'
    } else if (this.data.disgustLevel < 20) {
      return '好吧，再聊聊看。但别太得寸进尺。'
    } else if (this.data.disgustLevel < 30) {
      return '行，加回来吧。但你最好表现好点。'
    }
    
    return ''
  }

  // 检查是否被拉黑
  isBlocked(): boolean {
    return this.data?.isBlocked || false
  }

  // 检查是否被删除
  isDeleted(): boolean {
    return this.data?.isDeleted || false
  }

  // 获取拉黑状态
  getStatus(): string {
    if (!this.data) return '正常'
    
    if (this.data.isDeleted) {
      return `已删除好友 (${this.data.unblockCondition})`
    }
    
    if (this.data.isBlocked) {
      return `已拉黑 (${this.data.blockReason})`
    }
    
    if (this.data.disgustLevel > 0) {
      return `反感程度: ${this.data.disgustLevel}/100`
    }
    
    return '正常'
  }

  // 获取拉黑消息
  getBlockMessage(): string {
    if (!this.data) return ''
    
    if (this.data.isDeleted) {
      if (this.data.canUnblock) {
        return '你已被删除好友。过段时间可能会被加回来。'
      } else {
        return '你已被删除好友。不会被加回来了。'
      }
    }
    
    if (this.data.isBlocked) {
      if (this.data.canUnblock) {
        return '你已被拉黑。过段时间可能会被解除。'
      } else {
        return '你已被永久拉黑。'
      }
    }
    
    return ''
  }

  // 检查是否应该拉黑
  shouldBlock(message: string): boolean {
    if (!this.data) return false
    
    const lowerMessage = message.toLowerCase()
    
    // 骚扰行为
    if (lowerMessage.includes('约吗') || lowerMessage.includes('约不') || lowerMessage.includes('出来玩')) {
      this.increaseDisgust(20, '骚扰')
      return this.data.disgustLevel >= 50
    }
    
    // 色情内容
    if (lowerMessage.includes('色') || lowerMessage.includes('骚') || lowerMessage.includes('约炮')) {
      this.increaseDisgust(30, '色情骚扰')
      return this.data.disgustLevel >= 50
    }
    
    // 威胁
    if (lowerMessage.includes('杀') || lowerMessage.includes('死') || lowerMessage.includes('打')) {
      this.increaseDisgust(50, '威胁')
      return this.data.disgustLevel >= 50
    }
    
    // 反复骚扰
    if (this.data.disgustLevel >= 30) {
      // 已经有反感了，继续骚扰会增加
      this.increaseDisgust(10, '反复骚扰')
      return this.data.disgustLevel >= 50
    }
    
    return false
  }

  // 检查是否应该删除好友
  shouldDelete(): boolean {
    if (!this.data) return false
    return this.data.disgustLevel >= 80
  }

  // 检查是否可能被加回来
  canBeAddedBack(): boolean {
    return this.data?.canUnblock || false
  }

  // 清除所有数据
  clear(): void {
    this.data = {
      slug: this.slug,
      isBlocked: false,
      isDeleted: false,
      disgustLevel: 0,
      blockReason: '',
      blockTime: '',
      canUnblock: false,
      unblockCondition: '',
    }
    this.save()
  }
}

export const blocker = new Blocker()
