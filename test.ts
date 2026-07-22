// 测试脚本
import { creator } from './src/creator'
import { chatEngine } from './src/chat'

async function test() {
  console.log('========================================')
  console.log('    测试 AI人格项目')
  console.log('========================================')
  
  // 测试创建人格
  console.log('\n1. 测试创建人格...')
  const personality = await creator.create({
    name: '小明',
    description: '一个测试人格',
  })
  console.log(`创建成功: ${personality.name} (${personality.slug})`)
  
  // 测试列出人格
  console.log('\n2. 测试列出人格...')
  const list = creator.list()
  console.log(`共 ${list.length} 个人格: ${list.join(', ')}`)
  
  // 测试获取人格
  console.log('\n3. 测试获取人格...')
  const p = creator.get(personality.slug)
  console.log(`获取成功: ${p?.name}`)
  
  // 测试聊天
  console.log('\n4. 测试聊天...')
  chatEngine.loadPersonality(personality.slug)
  
  const replies = ['你好', '在干嘛', '想你了', '晚安']
  for (const msg of replies) {
    const reply = await chatEngine.generateReply(msg)
    console.log(`用户: ${msg}`)
    console.log(`${personality.name}: ${reply}`)
    console.log()
  }
  
  // 测试删除
  console.log('5. 测试删除人格...')
  const deleted = creator.delete(personality.slug)
  console.log(`删除${deleted ? '成功' : '失败'}`)
  
  console.log('\n========================================')
  console.log('    测试完成!')
  console.log('========================================')
}

test().catch(console.error)
