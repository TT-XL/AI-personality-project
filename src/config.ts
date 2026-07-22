// AI人格项目 - 配置管理

import * as fs from 'fs'
import * as path from 'path'

const CONFIG_DIR = path.join(process.cwd(), 'config')
const CONFIG_FILE = path.join(CONFIG_DIR, 'settings.json')

export interface AppConfig {
  aiProvider: string
  aiApiKey: string
  aiBaseUrl: string
  aiModel: string
}

// 默认配置
const DEFAULT_CONFIG: AppConfig = {
  aiProvider: 'agnes',
  aiApiKey: '',
  aiBaseUrl: 'https://apihub.agnes-ai.com/v1',
  aiModel: 'agnes-2.0-flash',
}

export class ConfigManager {
  private config: AppConfig = { ...DEFAULT_CONFIG }

  // 加载配置
  load(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true })
    }

    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const content = fs.readFileSync(CONFIG_FILE, 'utf-8')
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(content) }
        console.log('[config] 配置已加载')
      } catch (e) {
        console.log('[config] 配置文件损坏，使用默认配置')
        this.config = { ...DEFAULT_CONFIG }
      }
    } else {
      console.log('[config] 首次运行，需要配置')
    }
  }

  // 保存配置
  save(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true })
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2))
    console.log('[config] 配置已保存')
  }

  // 获取配置
  get(): AppConfig {
    return { ...this.config }
  }

  // 设置AI配置
  setAI(provider: string, apiKey: string, baseUrl?: string, model?: string): void {
    this.config.aiProvider = provider
    this.config.aiApiKey = apiKey
    if (baseUrl) this.config.aiBaseUrl = baseUrl
    if (model) this.config.aiModel = model
    this.save()
  }

  // 检查是否已配置AI
  isAIConfigured(): boolean {
    return !!this.config.aiApiKey
  }

  // 清除配置
  clear(): void {
    this.config = { ...DEFAULT_CONFIG }
    this.save()
  }
}

export const configManager = new ConfigManager()
