// AI人格项目 - 主入口（交互式菜单版）

import * as readline from 'readline'
import { creator } from './creator'
import { chatAIEngine } from './chat-ai'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (q: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(q, (answer) => {
      resolve(answer.trim())
    })
  })
}

// AI服务商列表
const PROVIDERS = [
  { name: 'Agnes AI', value: 'agnes', baseUrl: 'https://apihub.agnes-ai.com/v1', model: 'agnes-2.0-flash' },
  { name: 'OpenAI', value: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo' },
  { name: 'DeepSeek', value: 'deepseek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { name: '智谱 (GLM)', value: 'zhipu', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
]

async function main() {
  // 检查是否已配置
  if (!process.env.AI_API_KEY) {
    await setupAI()
  }

  // 主菜单循环
  while (true) {
    await showMainMenu()
  }
}

// 显示主菜单
async function showMainMenu() {
  console.log('\n========================================')
  console.log('           AI人格模拟项目')
  console.log('========================================\n')
  console.log('  1. 创建新人格')
  console.log('  2. 列出所有人格')
  console.log('  3. 与人格聊天')
  console.log('  4. 删除人格')
  console.log('  5. 重新配置AI')
  console.log('  0. 退出程序')
  console.log('\n========================================\n')

  const choice = await question('请选择 (0-5): ')

  switch (choice) {
    case '1':
      await handleCreate()
      break
    case '2':
      handleList()
      break
    case '3':
      await handleChat()
      break
    case '4':
      await handleDelete()
      break
    case '5':
      await setupAI()
      break
    case '0':
      console.log('\n再见!')
      rl.close()
      process.exit(0)
    default:
      console.log('\n无效选择，请重新输入')
  }
}

// AI配置
async function setupAI() {
  console.log('\n========================================')
  console.log('           AI配置')
  console.log('========================================\n')
  console.log('请选择AI服务商:\n')
  
  PROVIDERS.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`)
  })
  console.log(`  0. 返回主菜单`)
  console.log('\n========================================\n')

  const choice = await question('输入序号: ')
  
  if (choice === '0') return

  const index = parseInt(choice) - 1

  if (index < 0 || index >= PROVIDERS.length) {
    console.log('\n无效选择')
    return
  }

  const provider = PROVIDERS[index]
  process.env.AI_PROVIDER = provider.value
  process.env.AI_BASE_URL = provider.baseUrl
  process.env.AI_MODEL = provider.model
  console.log(`\n已选择: ${provider.name}`)

  const apiKey = await question('请输入API密钥 (输入0返回): ')
  if (apiKey === '0' || !apiKey) {
    console.log('已取消')
    return
  }

  process.env.AI_API_KEY = apiKey
  console.log('\n配置完成!')
}

// 创建人格
async function handleCreate() {
  console.log('\n========================================')
  console.log('           创建新人格')
  console.log('========================================\n')

  const name = await question('人格名字 (输入0返回): ')
  if (name === '0' || !name) {
    console.log('已取消')
    return
  }

  const description = await question('描述 (可选，直接回车跳过): ')

  await creator.create({
    name,
    description: description || undefined,
  })

  console.log(`\n创建成功: ${name}`)
  await question('\n按回车继续...')
}

// 列出所有人格
function handleList() {
  const slugs = creator.list()
  
  console.log('\n========================================')
  console.log('           所有人格')
  console.log('========================================\n')
  
  if (slugs.length === 0) {
    console.log('  还没有创建任何人格')
  } else {
    slugs.forEach((slug, i) => {
      const p = creator.get(slug)
      console.log(`  ${i + 1}. ${slug} - ${p?.description || '无描述'}`)
    })
  }
  
  console.log('\n========================================\n')
}

// 与人格聊天
async function handleChat() {
  const slugs = creator.list()
  
  if (slugs.length === 0) {
    console.log('\n还没有创建任何人格，请先创建')
    return
  }

  console.log('\n========================================')
  console.log('           选择人格')
  console.log('========================================\n')
  
  slugs.forEach((slug, i) => {
    const p = creator.get(slug)
    console.log(`  ${i + 1}. ${slug} - ${p?.description || '无描述'}`)
  })
  console.log(`  0. 返回主菜单`)
  console.log('\n========================================\n')

  const choice = await question('选择人格编号: ')
  
  if (choice === '0') return

  const index = parseInt(choice) - 1

  if (index < 0 || index >= slugs.length) {
    console.log('\n无效选择')
    return
  }

  const slug = slugs[index]
  if (!chatAIEngine.loadPersonality(slug)) {
    return
  }

  // 进入聊天模式
  await chatMode()
}

// 聊天模式
async function chatMode() {
  const name = chatAIEngine.getPersonality()?.name || '未知'
  
  console.log('\n========================================')
  console.log(`           与 ${name} 聊天`)
  console.log('========================================\n')
  console.log('  输入消息开始聊天')
  console.log('  输入 / 返回主菜单')
  console.log('  输入 /clear 清除历史')
  console.log('\n========================================\n')

  while (true) {
    const input = await question('你: ')
    
    if (input === '/') {
      chatAIEngine.saveSession()
      console.log('\n聊天结束，会话已保存')
      break
    }

    if (input === '/clear') {
      console.log('历史已清除')
      continue
    }

    if (!input) continue

    const reply = await chatAIEngine.generateReply(input)
    console.log(`${name}: ${reply}\n`)
  }
}

// 删除人格
async function handleDelete() {
  const slugs = creator.list()
  
  if (slugs.length === 0) {
    console.log('\n还没有创建任何人格')
    return
  }

  console.log('\n========================================')
  console.log('           删除人格')
  console.log('========================================\n')
  
  slugs.forEach((slug, i) => {
    const p = creator.get(slug)
    console.log(`  ${i + 1}. ${slug} - ${p?.description || '无描述'}`)
  })
  console.log(`  0. 返回主菜单`)
  console.log('\n========================================\n')

  const choice = await question('选择要删除的人格编号: ')
  
  if (choice === '0') return

  const index = parseInt(choice) - 1

  if (index < 0 || index >= slugs.length) {
    console.log('\n无效选择')
    return
  }

  const slug = slugs[index]
  const confirm = await question(`确定删除 "${slug}" 吗？(y/n): `)
  
  if (confirm.toLowerCase() === 'y') {
    if (creator.delete(slug)) {
      console.log(`\n已删除: ${slug}`)
    } else {
      console.log(`\n删除失败: ${slug}`)
    }
  } else {
    console.log('\n已取消')
  }
}

main().catch(console.error)
