// 测试多轮对话
import { Creator } from './src/creator'
import { chatAIEngine } from './src/chat-ai'

const creator = new Creator()

async function test() {
  console.log('========================================')
  console.log('    测试多轮对话')
  console.log('========================================\n')

  // 创建人格
  console.log('1. 创建人格...')
  const p = await creator.create({ name: '小红', gender: '女', description: '测试人格' })
  console.log(`创建成功: ${p.name}\n`)

  // 加载人格
  chatAIEngine.loadPersonality(p.slug)

  // 测试多轮对话
  const conversations = [
    '你好呀',
    '在干嘛呢',
    '吃饭了吗',
    '今天天气怎么样',
    '想你了',
    '晚安',
  ]

  console.log('2. 开始多轮对话...\n')
  
  for (const msg of conversations) {
    console.log(`用户: ${msg}`)
    const reply = await chatAIEngine.generateReply(msg)
    console.log(`小红: ${reply}\n`)
  }

  // 清理
  console.log('3. 测试完成!')
  creator.delete(p.slug)
  
  process.exit(0)
}

test().catch(console.error)
