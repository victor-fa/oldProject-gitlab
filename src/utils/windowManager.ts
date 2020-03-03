import { BrowserWindow, Menu } from 'electron'

interface WindowOptions extends Electron.BrowserWindowConstructorOptions {
  path: string
}
interface WindowPoint {
  x: number,
  y: number
}
interface WindowSize {
  width: number,
  height: number
}

let loginWindow: BrowserWindow | null = null
let operateListWindow: BrowserWindow | null = null
const packageInfo = require('../../package.json')

export default {
  createWindow (options: WindowOptions): BrowserWindow {
    Menu.setApplicationMenu(null)
    let defaultOptions = {
      width: 800,
      height: 600,
      title: packageInfo.name,
      useContentSize: false,
      transparent: false,
      minimizable: true,
      maximizable: true,
      resizable: true,
      backgroundColor: '#f6f8fb',
      webPreferences: {
        nodeIntegration: true,
        webSecurity: false
      }
    }
    const newOptions = Object.assign(defaultOptions, options)
    let window: BrowserWindow | null
    window = new BrowserWindow(newOptions)
    newOptions.backgroundColor && (window.setBackgroundColor(newOptions.backgroundColor))
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      const url = (process.env.WEBPACK_DEV_SERVER_URL as string) + '#/' + newOptions.path
      window.loadURL(url)
      if (!process.env.IS_TEST && newOptions.path !== 'operate-list-alter') window.webContents.openDevTools()
    } else {
      window.loadURL('app://./index.html#/' + newOptions.path)
    }
    window.webContents.on('page-title-updated', () => {
      if (window !== null) {
        window.setTitle(newOptions.title)
      }
    })
    return window
  },
  activeWindow (win: BrowserWindow): void {
    win.show()
    win.focus()
  },
  presentLoginWindow (): void {
    if (loginWindow !== null) {
      this.activeWindow(loginWindow)
      return
    }
    loginWindow = this.createWindow({
      path: 'login-layout',
      width: 800,
      height: 600,
      title: '登录',
      webPreferences: {
        nodeIntegration: true
      }
    })
    loginWindow.on('closed', () => {
      loginWindow = null
    })
  },
  presentOperateListWindow (data: any): void {
    if (operateListWindow) {
      this.activeWindow(operateListWindow)
      return
    }
    const { resourceType, screenW, screenH, screenX, screenY } = data[0]
    const safePoint = calculateSafePoint({ x: screenX, y: screenH }, { width: screenW, height: screenY })
    operateListWindow = this.createWindow({
      path: 'operate-list-alter',
      x: safePoint.x,
      y: safePoint.y,
      width: 100,
      height: 185,
      frame: false,
      resizable: false,
      movable: false,
      webPreferences: {
        nodeIntegration: true
      }
    })
    operateListWindow.on('closed', () => {
      operateListWindow = null
    })
  }
}

const calculateSafePoint = (point: WindowPoint, screen: WindowSize) => {
  const padding = 5
  const width = 100
  const height = 185
  const currentX = point.x + width + padding
  const currentY = point.y + height + padding
  const safeX = currentX < screen.width ? point.x : screen.width - width - padding
  const safeY = currentY < screen.height ? point.y : screen.height - height - padding
  return { x: point.x, y: point.y }
}
