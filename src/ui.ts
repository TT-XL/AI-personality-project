// AI陪伴养成 - 终端UI

import * as readline from 'readline'
import chalk from 'chalk'
import { creator } from './creator'
import { chatAIEngine } from './chat-ai'
import { configManager } from './config'
import { blocker } from './blocker'
import { relationshipManager } from './relationship'
import { memoryManager } from './memory'

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

// 清屏
function clearScreen() {
  console.clear()
}

// 显示Logo
function showLogo() {
  console.log(chalk.cyan('╔══════════════════════════════════════╗'))
  console.log(chalk.cyan('║                                      ║'))
  console.log(chalk.cyan('║        AI陪伴养成 v1.0               ║'))
  console.log(chalk.cyan('║   像真人一样的AI陪伴                 ║'))
  console.log(chalk.cyan('║                                      ║'))
  console.log(chalk.cyan('╚══════════════════════════════════════╝'))
  console.log()
}

// 显示主菜单
async function showMainMenu() {
  clearScreen()
  showLogo()
  
  console.log(chalk.yellow('  1. 创建新人格'))
  console.log(chalk.yellow('  2. 与人格聊天'))
  console.log(chalk.yellow('  3. 人格管理'))
  console.log(chalk.yellow('  4. 设置'))
  console.log(chalk.red('  0. 退出'))
  console.log()

  const choice = await question(chalk.cyan('请选择: '))
  return choice
}

// 创建人格
async function handleCreate() {
  clearScreen()
  console.log(chalk.yellow('=== 创建新人格 ===\n'))
  
  console.log('选择性别:')
  console.log('  1. 女生')
  console.log('  2. 男生')
  console.log()
  
  const genderChoice = await question('输入序号: ')
  const gender = genderChoice === '2' ? '男' : '女'
  
  const name = await question('人格网名 (可选，直接回车自动生成): ')
  const description = await question('描述 (可选): ')
  
  await creator.create({
    name: name || undefined,
    gender,
    description: description || undefined,
  })
  
  console.log(chalk.green('\n✅ 创建成功!'))
  await question('\n按回车继续...')
}

// 聊天界面
async function handleChat() {
  const slugs = creator.list()
  
  if (slugs.length === 0) {
    console.log(chalk.red('\n还没有创建任何人格'))
    await question('\n按回车继续...')
    return
  }
  
  clearScreen()
  console.log(chalk.yellow('=== 选择人格 ===\n'))
  
  slugs.forEach((slug, i) => {
    const p = creator.get(slug)
    console.log(`  ${chalk.cyan(i + 1)}. ${slug} - ${p?.description || '无描述'}`)
  })
  console.log()
  
  const choice = await question('选择人格编号: ')
  const index = parseInt(choice) - 1
  
  if (index < 0 || index >= slugs.length) {
    console.log(chalk.red('\n无效选择'))
    await question('\n按回车继续...')
    return
  }
  
  const slug = slugs[index]
  chatAIEngine.loadPersonality(slug)
  
  // 进入聊天
  await chatMode(slug)
}

// 聊天模式
async function chatMode(slug: string) {
  const p = creator.get(slug)
  const name = p?.name || slug
  
  clearScreen()
  console.log(chalk.cyan('╔══════════════════════════════════════╗'))
  console.log(chalk.cyan(`║  与 ${name} 聊天                      ║`))
  console.log(chalk.cyan('╚══════════════════════════════════════╝'))
  console.log()
  console.log(chalk.gray('  输入 / 返回菜单'))
  console.log(chalk.gray('  输入 /history 查看历史'))
  console.log()
  
  while (true) {
    const input = await question(chalk.green('你: '))
    
    if (input === '/') {
      break
    }
    
    if (input === '/history') {
      showHistory(slug)
      continue
    }
    
    if (!input) continue
    
    process.stdout.write(chalk.gray(`${name}: 思考中...`))
    const reply = await chatAIEngine.generateReply(input)
    process.stdout.write('\r' + ' '.repeat(50) + '\r')
    
    if (reply) {
      console.log(`${chalk.cyan(name)}: ${reply}\n`)
    } else {
      console.log(`${chalk.gray(name)}: ${chalk.gray('（已读不回）')}\n`)
    }
  }
}

// 显示历史记录
function showHistory(slug: string) {
  const memoryPath = `memories/${slug}.json`
  const fs = require('fs')
  
  if (!fs.existsSync(memoryPath)) {
    console.log(chalk.gray('\n  没有聊天记录'))
    return
  }
  
  const data = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'))
  
  console.log(chalk.yellow('\n=== 聊天记录 ===\n'))
  
  if (data.conversations.length === 0) {
    console.log(chalk.gray('  没有聊天记录'))
  } else {
    data.conversations.slice(-5).forEach((conv: any) => {
      const time = new Date(conv.timestamp).toLocaleTimeString()
      console.log(chalk.gray(`  [${time}]`))
      console.log(`  ${chalk.green('你')}: ${conv.userMessage}`)
      console.log(`  ${chalk.cyan(slug)}: ${conv.aiReply}`)
      console.log()
    })
  }
  
  console.log(chalk.gray('========================================'))
}

// 人格管理
async function handleManagement() {
  clearScreen()
  console.log(chalk.yellow('=== 人格管理 ===\n'))
  
  const slugs = creator.list()
  
  if (slugs.length === 0) {
    console.log(chalk.gray('  还没有创建任何人格'))
    await question('\n按回车继续...')
    return
  }
  
  slugs.forEach((slug, i) => {
    const p = creator.get(slug)
    blocker.load(slug)
    const status = blocker.getStatus()
    console.log(`  ${chalk.cyan(i + 1)}. ${slug}`)
    console.log(`     ${chalk.gray(status)}`)
  })
  console.log()
  
  const choice = await question('选择要管理的人格 (输入d删除): ')
  
  if (choice.startsWith('d')) {
    const index = parseInt(choice.substring(1)) - 1
    if (index >= 0 && index < slugs.length) {
      const slug = slugs[index]
      const confirm = await question(`确定删除 "${slug}" 吗? (y/n): `)
      if (confirm.toLowerCase() === 'y') {
        creator.delete(slug)
        console.log(chalk.green(`\n已删除: ${slug}`))
      }
    }
  }
  
  await question('\n按回车继续...')
}

// 主函数
async function main() {
  // 加载配置
  configManager.load()
  
  if (configManager.isAIConfigured()) {
    const cfg = configManager.get()
    process.env.AI_PROVIDER = cfg.aiProvider
    process.env.AI_API_KEY = cfg.aiApiKey
    process.env.AI_BASE_URL = cfg.aiBaseUrl
    process.env.AI_MODEL = cfg.aiModel
  }
  
  while (true) {
    const choice = await showMainMenu()
    
    switch (choice) {
      case '1':
        await handleCreate()
        break
      case '2':
        await handleChat()
        break
      case '3':
        await handleManagement()
        break
      case '4':
        // 设置
        break
      case '0':
        console.log(chalk.green('\n再见!'))
        rl.close()
        process.exit(0)
      default:
        console.log(chalk.red('\n无效选择'))
        await question('\n按回车继续...')
    }
  }
}

main().catch(console.error)
