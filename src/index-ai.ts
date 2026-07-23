// AI人格项目 - 主入口（交互式菜单版）

import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'
import { creator } from './creator'
import { chatAIEngine } from './chat-ai'
import { blocker } from './blocker'
import { configManager } from './config'

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
  { name: '通义千问', value: 'tongyi', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
  { name: '文心一言', value: 'wenxin', baseUrl: 'https://aip.baidublatform.com/rpc/2.0/ai_custom/v1/wenxinworkshop', model: 'ernie-speed-128k' },
  { name: '月之暗面', value: 'moonshot', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { name: '零一万物', value: 'lingyiwanwu', baseUrl: 'https://api.lingyiwanwu.com/v1', model: 'yi-large' },
  { name: '自定义API', value: 'custom', baseUrl: '', model: '' },
]

async function main() {
  // 加载配置
  configManager.load()
  
  // 如果已配置AI，设置环境变量
  if (configManager.isAIConfigured()) {
    const cfg = configManager.get()
    process.env.AI_PROVIDER = cfg.aiProvider
    process.env.AI_API_KEY = cfg.aiApiKey
    process.env.AI_BASE_URL = cfg.aiBaseUrl
    process.env.AI_MODEL = cfg.aiModel
    console.log('[config] 已加载保存的配置')
  } else {
    // 首次运行，需要配置
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
  console.log('           AI陪伴养成')
  console.log('========================================\n')
  console.log('  1. 创建新人格')
  console.log('  2. 列出所有人格')
  console.log('  3. 与人格聊天')
  console.log('  4. 删除人格')
  console.log('  5. 人格管理')
  console.log('  6. 重新配置AI')
  console.log('  0. 退出程序')
  console.log('\n========================================\n')

  const choice = await question('请选择 (0-6): ')

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
      await handleManagement()
      break
    case '6':
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

  // 如果是自定义API，需要输入更多配置
  if (provider.value === 'custom') {
    const baseUrl = await question('请输入API地址 (输入0返回): ')
    if (baseUrl === '0' || !baseUrl) {
      console.log('已取消')
      return
    }
    
    const model = await question('请输入模型名称: ')
    if (!model) {
      console.log('已取消')
      return
    }
    
    process.env.AI_BASE_URL = baseUrl
    process.env.AI_MODEL = model
  }

  const apiKey = await question('请输入API密钥 (输入0返回): ')
  if (apiKey === '0' || !apiKey) {
    console.log('已取消')
    return
  }

  process.env.AI_API_KEY = apiKey
  
  // 保存配置
  configManager.setAI(provider.value, apiKey, process.env.AI_BASE_URL, process.env.AI_MODEL)
  
  console.log('\n配置完成! 密钥已保存到本地')
}

// 创建人格
async function handleCreate() {
  console.log('\n========================================')
  console.log('           创建新人格')
  console.log('========================================\n')

  // 选择性别
  console.log('选择性别:')
  console.log('  1. 女生')
  console.log('  2. 男生')
  console.log('  0. 返回主菜单\n')

  const genderChoice = await question('输入序号: ')
  if (genderChoice === '0') return

  const gender = genderChoice === '2' ? '男' : '女'
  console.log(`\n已选择: ${gender}生`)

  // 人格名字（可选，不填会自动生成）
  const name = await question('人格网名 (可选，直接回车自动生成): ')
  
  const description = await question('描述 (可选，直接回车跳过): ')

  await creator.create({
    name: name || undefined,
    gender,
    description: description || undefined,
  })

  console.log(`\n创建成功!`)
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

    process.stdout.write(`${name}: 思考中...`)
    const reply = await chatAIEngine.generateReply(input)
    process.stdout.write('\r' + ' '.repeat(50) + '\r')
    
    if (reply) {
      console.log(`${name}: ${reply}\n`)
    } else {
      // 不回复，模拟已读不回
      console.log(`${name}: （已读不回）\n`)
    }
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

// 人格管理
async function handleManagement() {
  console.log('\n========================================')
  console.log('           人格管理')
  console.log('========================================\n')
  console.log('  1. 查看所有人格状态')
  console.log('  2. 查看聊天记录')
  console.log('  3. 清除拉黑/删除记录')
  console.log('  4. 尝试重新添加被删除的人格')
  console.log('  0. 返回主菜单')
  console.log('\n========================================\n')

  const choice = await question('请选择 (0-4): ')

  switch (choice) {
    case '1':
      handleViewStatus()
      break
    case '2':
      await handleViewHistory()
      break
    case '3':
      await handleClearBlock()
      break
    case '4':
      await handleReaddPersonality()
      break
    case '0':
      return
    default:
      console.log('\n无效选择')
  }
}

// 查看所有人格状态
function handleViewStatus() {
  const slugs = creator.list()
  
  console.log('\n========================================')
  console.log('           人格状态')
  console.log('========================================\n')
  
  if (slugs.length === 0) {
    console.log('  还没有创建任何人格')
  } else {
    slugs.forEach((slug, i) => {
      const p = creator.get(slug)
      blocker.load(slug)
      const status = blocker.getStatus()
      console.log(`  ${i + 1}. ${slug} - ${p?.description || '无描述'}`)
      console.log(`     状态: ${status}`)
    })
  }
  
  console.log('\n========================================\n')
}

// 查看聊天记录
async function handleViewHistory() {
  const slugs = creator.list()
  
  if (slugs.length === 0) {
    console.log('\n还没有创建任何人格')
    return
  }

  console.log('\n========================================')
  console.log('           查看聊天记录')
  console.log('========================================\n')
  
  slugs.forEach((slug, i) => {
    const p = creator.get(slug)
    console.log(`  ${i + 1}. ${slug} - ${p?.description || '无描述'}`)
  })
  console.log(`  0. 返回`)
  console.log('\n========================================\n')

  const choice = await question('选择要查看的人格编号: ')
  
  if (choice === '0') return

  const index = parseInt(choice) - 1

  if (index < 0 || index >= slugs.length) {
    console.log('\n无效选择')
    return
  }

  const slug = slugs[index]
  
  // 读取记忆文件
  const memoryPath = path.join(process.cwd(), 'memories', `${slug}.json`)
  if (!fs.existsSync(memoryPath)) {
    console.log('\n没有聊天记录')
    return
  }

  const memoryData = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'))
  
  console.log('\n========================================')
  console.log(`           ${slug} 的聊天记录`)
  console.log('========================================\n')
  
  if (memoryData.conversations.length === 0) {
    console.log('  没有聊天记录')
  } else {
    memoryData.conversations.forEach((conv: any, i: number) => {
      const time = new Date(conv.timestamp).toLocaleString()
      console.log(`  [${time}]`)
      console.log(`  用户: ${conv.userMessage}`)
      console.log(`  ${slug}: ${conv.aiReply}`)
      console.log()
    })
  }
  
  console.log('========================================\n')
}

// 清除拉黑/删除记录
async function handleClearBlock() {
  const slugs = creator.list()
  
  if (slugs.length === 0) {
    console.log('\n还没有创建任何人格')
    return
  }

  console.log('\n========================================')
  console.log('           清除拉黑记录')
  console.log('========================================\n')
  
  slugs.forEach((slug, i) => {
    const p = creator.get(slug)
    blocker.load(slug)
    const status = blocker.getStatus()
    console.log(`  ${i + 1}. ${slug} - ${status}`)
  })
  console.log(`  0. 返回`)
  console.log('\n========================================\n')

  const choice = await question('选择要清除记录的人格编号: ')
  
  if (choice === '0') return

  const index = parseInt(choice) - 1

  if (index < 0 || index >= slugs.length) {
    console.log('\n无效选择')
    return
  }

  const slug = slugs[index]
  blocker.load(slug)
  blocker.clear()
  console.log(`\n已清除 ${slug} 的拉黑记录`)
}

// 尝试重新添加被删除的人格
async function handleReaddPersonality() {
  // 查找被拉黑/删除的人格
  const blocksDir = path.join(process.cwd(), 'blocks')
  if (!fs.existsSync(blocksDir)) {
    console.log('\n没有被拉黑/删除的人格')
    return
  }

  const blockFiles = fs.readdirSync(blocksDir).filter(f => f.endsWith('.json'))
  
  if (blockFiles.length === 0) {
    console.log('\n没有被拉黑/删除的人格')
    return
  }

  console.log('\n========================================')
  console.log('           重新添加人格')
  console.log('========================================\n')
  
  blockFiles.forEach((file, i) => {
    const slug = file.replace('.json', '')
    blocker.load(slug)
    const status = blocker.getStatus()
    const canReadd = blocker.canBeReadded()
    console.log(`  ${i + 1}. ${slug} - ${status}`)
    console.log(`     可以重新添加: ${canReadd ? '是' : '否'}`)
  })
  console.log(`  0. 返回`)
  console.log('\n========================================\n')

  const choice = await question('选择要重新添加的人格编号: ')
  
  if (choice === '0') return

  const index = parseInt(choice) - 1

  if (index < 0 || index >= blockFiles.length) {
    console.log('\n无效选择')
    return
  }

  const slug = blockFiles[index].replace('.json', '')
  blocker.load(slug)
  
  if (!blocker.canBeReadded()) {
    console.log('\n这个人格无法重新添加（已被彻底删除）')
    return
  }

  const confirm = await question(`确定要重新添加 "${slug}" 吗？(y/n): `)
  
  if (confirm.toLowerCase() === 'y') {
    const result = blocker.tryReadd()
    if (result.success) {
      console.log(`\n已重新添加: ${slug}`)
      console.log(`人格说: ${result.message}`)
    } else {
      console.log(`\n无法重新添加: ${result.message}`)
    }
  } else {
    console.log('\n已取消')
  }
}

main().catch(console.error)
