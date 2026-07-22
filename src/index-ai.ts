// AI人格项目 - 主入口（AI版本）

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

async function main() {
  console.log('========================================')
  console.log('    AI人格模拟项目 v1.0 (AI版)')
  console.log('    把人蒸馏成 AI Skill')
  console.log('========================================')
  console.log()
  
  // 检查AI配置
  if (!process.env.AI_API_KEY) {
    console.log('  提示: 未配置AI API，将使用本地回复')
    console.log('  配置方法:')
    console.log('    set AI_API_KEY=你的API密钥')
    console.log('    set AI_PROVIDER=openai/deepseek/zhipu')
    console.log('    set AI_MODEL=gpt-3.5-turbo')
    console.log()
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
        showConfig()
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

function showHelp() {
  console.log(`
命令列表:
  create <名字> [文件路径]  - 创建新人格
  list                     - 列出所有人格
  chat <slug>              - 与人格聊天
  delete <slug>            - 删除人格
  config                   - 查看AI配置
  help                     - 显示帮助
  quit                     - 退出程序
`)
}

function showConfig() {
  console.log(`
AI配置:
  提供商: ${process.env.AI_PROVIDER || '未配置'}
  模型: ${process.env.AI_MODEL || 'gpt-3.5-turbo'}
  API密钥: ${process.env.AI_API_KEY ? '已配置' : '未配置'}
  
配置方法 (Windows PowerShell):
  $env:AI_API_KEY="你的密钥"
  $env:AI_PROVIDER="openai"
  $env:AI_MODEL="gpt-3.5-turbo"
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
