// AI陪伴养成 - Web服务器

import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import { creator } from './src/creator'
import { chatAIEngine } from './src/chat-ai'

const PORT = 3000

// MIME类型
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
}

// 创建服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // API路由
  if (req.url === '/api/personalities' && req.method === 'GET') {
    const slugs = creator.list()
    const personalities = slugs.map(slug => {
      const p = creator.get(slug)
      return { slug, name: p?.name, description: p?.description }
    })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(personalities))
    return
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', async () => {
      try {
        const { slug, message } = JSON.parse(body)
        
        // 加载人格
        chatAIEngine.loadPersonality(slug)
        
        // 生成回复
        const reply = await chatAIEngine.generateReply(message)
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ reply }))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '服务器错误' }))
      }
    })
    return
  }

  // 静态文件服务
  let filePath = req.url === '/' ? '/index.html' : req.url
  filePath = path.join(__dirname, 'public', filePath)

  const ext = path.extname(filePath)
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404)
      res.end('404 Not Found')
    } else {
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    }
  })
})

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`)
  console.log(`  AI陪伴养成 Web界面`)
  console.log(`========================================\n`)
  console.log(`  本机访问: http://localhost:${PORT}`)
  console.log(`  局域网访问: http://你的IP:${PORT}`)
  console.log(`  按 Ctrl+C 停止\n`)
})
