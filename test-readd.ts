// 测试加回来功能
import { Creator } from './src/creator'
import { chatAIEngine } from './src/chat-ai'
import { blocker } from './src/blocker'

const creator = new Creator()

async function test() {
  console.log('========================================')
  console.log('    测试加回来功能')
  console.log('========================================\n')

  // 创建人格
  console.log('1. 创建人格...')
  const p = await creator.create({ name: '小红', gender: '女', description: '测试人格' })
  console.log(`创建成功: ${p.name}\n`)

  // 加载人格
  chatAIEngine.loadPersonality(p.slug)

  // 测试对话
  const conversations = [
    '你好',
    '约吗',
    '滚',
    '对不起，我错了',
    '对不起，真的错了',
  ]

  console.log('2. 开始对话...\n')
  
  for (const msg of conversations) {
    console.log(`用户: ${msg}`)
    const reply = await chatAIEngine.generateReply(msg)
    if (reply) {
      console.log(`小红: ${reply}\n`)
    } else {
      console.log(`小红: （已读不回）\n`)
    }
    
    // 模拟时间流逝（测试用）
    console.log('（模拟时间流逝...）\n')
  }

  // 清理
  console.log('3. 测试完成!')
  creator.delete(p.slug)
  
  process.exit(0)
}

test().catch(console.error)
