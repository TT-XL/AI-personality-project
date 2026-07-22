// 测试AI版本
import { creator } from './src/creator'
import { chatAIEngine } from './src/chat-ai'

async function test() {
  console.log('========================================')
  console.log('    测试 AI人格项目 (Agnes AI)')
  console.log('========================================')
  
  // 检查API配置
  console.log('\nAPI配置:')
  console.log(`  提供商: ${process.env.AI_PROVIDER || '未配置'}`)
  console.log(`  API密钥: ${process.env.AI_API_KEY ? '已配置' : '未配置'}`)
  
  // 测试创建人格
  console.log('\n1. 测试创建人格...')
  const personality = await creator.create({
    name: '小红',
    description: '测试AI人格',
  })
  console.log(`创建成功: ${personality.name} (${personality.slug})`)
  
  // 测试聊天
  console.log('\n2. 测试AI聊天...')
  chatAIEngine.loadPersonality(personality.slug)
  
  const messages = ['你好呀', '在干嘛', '想你了', '今天心情不好']
  for (const msg of messages) {
    console.log(`\n用户: ${msg}`)
    const reply = await chatAIEngine.generateReply(msg)
    console.log(`小红: ${reply}`)
  }
  
  // 清理
  console.log('\n3. 清理...')
  creator.delete(personality.slug)
  console.log('测试完成!')
  
  process.exit(0)
}

test().catch(console.error)
