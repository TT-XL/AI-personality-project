// 测试拉黑/删除逻辑
import { Creator } from './src/creator'
import { chatAIEngine } from './src/chat-ai'
import { blocker } from './src/blocker'

const creator = new Creator()

async function test() {
  console.log('========================================')
  console.log('    测试拉黑/删除逻辑')
  console.log('========================================\n')

  // 创建人格
  console.log('1. 创建人格...')
  const p = await creator.create({ name: '小红', gender: '女', description: '测试人格' })
  console.log(`创建成功: ${p.name}\n`)

  // 加载人格
  chatAIEngine.loadPersonality(p.slug)

  // 测试1：正常对话
  console.log('=== 测试1：正常对话 ===')
  const conversations1 = ['你好', '在干嘛呢', '吃饭了吗']
  for (const msg of conversations1) {
    console.log(`用户: ${msg}`)
    const reply = await chatAIEngine.generateReply(msg)
    if (reply) {
      console.log(`小红: ${reply}\n`)
    } else {
      console.log(`小红: （已读不回）\n`)
    }
  }

  // 测试2：骚扰导致拉黑
  console.log('=== 测试2：骚扰导致拉黑 ===')
  const conversations2 = ['约吗', '约吗', '约吗']
  for (const msg of conversations2) {
    console.log(`用户: ${msg}`)
    const reply = await chatAIEngine.generateReply(msg)
    if (reply) {
      console.log(`小红: ${reply}\n`)
    } else {
      console.log(`小红: （已读不回）\n`)
    }
  }

  // 测试3：删除好友
  console.log('=== 测试3：删除好友 ===')
  console.log(`用户: 小红还在吗？`)
  const reply3 = await chatAIEngine.generateReply('小红还在吗？')
  if (reply3) {
    console.log(`小红: ${reply3}\n`)
  } else {
    console.log(`小红: （已读不回）\n`)
  }

  // 清理
  console.log('4. 测试完成!')
  creator.delete(p.slug)
  
  process.exit(0)
}

test().catch(console.error)
