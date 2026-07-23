// Electron主进程

const { app, BrowserWindow } = require('electron')
const path = require('path')

// 启动Web服务器
require('./server')

function createWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 750,
    title: 'AI陪伴养成',
    icon: path.join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    resizable: false,
    fullscreenable: false
  })

  win.loadURL('http://localhost:3000')
  
  // 移除菜单栏
  win.setMenuBarVisibility(false)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})
