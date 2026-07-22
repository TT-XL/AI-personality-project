// 测试陌生人对话
import { Creator } from './src/creator'
import { chatAIEngine } from './src/chat-ai'

const creator = new Creator()

async function test() {
  console.log('========================================')
  console.log('    测试陌生人对话')
  console.log('========================================\n')

  // 创建人格
  console.log('1. 创建人格...')
  const p = await creator.create({ name: '小红', gender: '女', description: '测试人格' })
  console.log(`创建成功: ${p.name}\n`)

  // 加载人格
  chatAIEngine.loadPersonality(p.slug)

  // 测试陌生人对话
  const conversations = [
    '你好，你是小红吗？我是从群里加的你',
    '没什么，就是看你头像挺好看的，想认识一下',
    '那你平时喜欢玩什么游戏啊',
    '哦哦，那你平时喜欢干嘛啊',
    '那你在干嘛呢',
    '想你了',
    '晚安',
  ]

  console.log('2. 开始陌生人对话...\n')
  
  for (const msg of conversations) {
    console.log(`用户: ${msg}`)
    const reply = await chatAIEngine.generateReply(msg)
    if (reply) {
      console.log(`小红: ${reply}\n`)
    } else {
      console.log(`小红: （已读不回）\n`)
    }
  }

  // 清理
  console.log('3. 测试完成!')
  creator.delete(p.slug)
  
  process.exit(0)
}

test().catch(console.error)
