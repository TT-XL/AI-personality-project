// AI人格项目 - 主入口

import * as readline from 'readline'
import { creator } from './creator'
import { chatEngine } from './chat'

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
  console.log('    AI人格模拟项目 v1.0')
  console.log('    把人蒸馏成 AI Skill')
  console.log('========================================')
  console.log()

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

  if (!chatEngine.loadPersonality(slug)) {
    return
  }

  console.log(`\n开始与 ${chatEngine.getPersonality()?.name} 聊天`)
  console.log('输入 /help 查看命令，/quit 退出聊天\n')

  while (true) {
    const input = await question('你: ')
    
    if (input === '/quit') {
      chatEngine.saveSession()
      console.log('聊天结束\n')
      break
    }

    const reply = await chatEngine.generateReply(input)
    console.log(`${chatEngine.getPersonality()?.name}: ${reply}\n`)
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

// 启动程序
main().catch(console.error)
