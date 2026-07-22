// AI人格项目 - 主入口（AI版 - 交互式配置）

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
  console.log('========================================')
  console.log('    AI人格模拟项目 v1.0 (AI版)')
  console.log('    把人蒸馏成 AI Skill')
  console.log('========================================')
  console.log()

  // 检查是否已配置
  if (!process.env.AI_API_KEY) {
    await setupAI()
  }

  while (true) {
    const input = await question('> ')
    const parts = input.split(' ')
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1).join(' ')

    switch (cmd) {
      case 'help':
        showHelp()
        break

      case 'create':
        await handleCreate(args)
        break

      case 'list':
        handleList()
        break

      case 'chat':
        await handleChat(args)
        break

      case 'delete':
        handleDelete(args)
        break

      case 'config':
        await setupAI()
        break

      case 'quit':
      case 'exit':
        console.log('再见!')
        rl.close()
        process.exit(0)

      default:
        if (cmd) {
          console.log(`未知命令: ${cmd}，输入 help 查看帮助`)
        }
    }
  }
}

// 交互式AI配置
async function setupAI() {
  console.log('\n【AI配置】')
  console.log('请选择AI服务商:\n')
  
  PROVIDERS.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`)
  })
  console.log()

  const choice = await question('输入序号 (1-4): ')
  const index = parseInt(choice) - 1

  if (index < 0 || index >= PROVIDERS.length) {
    console.log('无效选择，使用默认: Agnes AI')
    process.env.AI_PROVIDER = 'agnes'
  } else {
    const provider = PROVIDERS[index]
    process.env.AI_PROVIDER = provider.value
    process.env.AI_BASE_URL = provider.baseUrl
    process.env.AI_MODEL = provider.model
    console.log(`已选择: ${provider.name}`)
  }

  const apiKey = await question('\n请输入API密钥: ')
  if (apiKey) {
    process.env.AI_API_KEY = apiKey
    console.log('配置完成!\n')
  } else {
    console.log('未输入密钥，将使用本地回复\n')
  }
}

function showHelp() {
  console.log(`
命令列表:
  create <名字> [文件路径]  - 创建新人格
  list                     - 列出所有人格
  chat <slug>              - 与人格聊天
  delete <slug>            - 删除人格
  config                   - 重新配置AI
  help                     - 显示帮助
  quit                     - 退出程序
`)
}

async function handleCreate(args: string) {
  const parts = args.split(' ')
  const name = parts[0]
  const filePath = parts[1]

  if (!name) {
    console.log('请提供名字，例如: create 小明')
    return
  }

  const description = await question('描述 (可选): ')

  await creator.create({
    name,
    chatFile: filePath,
    description: description || undefined,
  })

  console.log('创建成功!')
}

function handleList() {
  const slugs = creator.list()
  if (slugs.length === 0) {
    console.log('还没有创建任何人格')
    return
  }

  console.log('\n所有人格:')
  slugs.forEach((slug, i) => {
    const p = creator.get(slug)
    console.log(`  ${i + 1}. ${slug} - ${p?.description || '无描述'}`)
  })
  console.log()
}

async function handleChat(slug: string) {
  if (!slug) {
    console.log('请提供人格slug，例如: chat xiaoming')
    return
  }

  if (!chatAIEngine.loadPersonality(slug)) {
    return
  }

  console.log(`\n开始与 ${chatAIEngine.getPersonality()?.name} 聊天`)
  console.log('输入 /help 查看命令，/quit 退出聊天\n')

  while (true) {
    const input = await question('你: ')
    
    if (input === '/quit') {
      chatAIEngine.saveSession()
      console.log('聊天结束\n')
      break
    }

    if (input === '/help') {
      console.log('命令: /quit 退出, /clear 清除历史')
      continue
    }

    if (input === '/clear') {
      console.log('历史已清除')
      continue
    }

    const reply = await chatAIEngine.generateReply(input)
    console.log(`${chatAIEngine.getPersonality()?.name}: ${reply}\n`)
  }
}

function handleDelete(slug: string) {
  if (!slug) {
    console.log('请提供人格slug，例如: delete xiaoming')
    return
  }

  if (creator.delete(slug)) {
    console.log(`已删除: ${slug}`)
  } else {
    console.log(`找不到: ${slug}`)
  }
}

main().catch(console.error)
