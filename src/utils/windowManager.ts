import { BrowserWindow, Menu } from 'electron'

interface WindowOptions extends Electron.BrowserWindowConstructorOptions {
  path: string
}

let loginWindow: BrowserWindow | null = null
let homeWindow: BrowserWindow | null = null
const packageInfo = require('../../package.json')

export default {
  createWindow (options: WindowOptions): BrowserWindow {
    Menu.setApplicationMenu(null)
    let defaultOptions = {
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 450,
      title: packageInfo.name,
      useContentSize: false,
      transparent: false,
      minimizable: true,
      maximizable: true,
      resizable: true,
      frame: false,
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
      // Load the url of the dev server if in development mode
      const url = (process.env.WEBPACK_DEV_SERVER_URL as string) + '#/' + newOptions.path
      window.loadURL(url)
      if (!process.env.IS_TEST && newOptions.path !== 'operate-list-alter') window.webContents.openDevTools()
    } else {
      // Load the index.html when not in development
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
  closeCurrentWindow (): void {
    const wins = BrowserWindow.getAllWindows()
    for (let index = 0; index < wins.length; index++) {
      const win = wins[index]
      win.close()
    }
  },
  presentLoginWindow (): BrowserWindow {
    this.closeCurrentWindow()
    if (loginWindow !== null) {
      this.activeWindow(loginWindow)
    } else {
      loginWindow = this.createWindow({
        path: 'login-layout',
        width: 800,
        height: 600,
        title: '登录',
        resizable: false,
        webPreferences: {
          nodeIntegration: true
        }
      })
    }
    loginWindow.on('closed', () => {
      loginWindow = null
    })
    return loginWindow
  },
  presentHomeWindow (): BrowserWindow {
    this.closeCurrentWindow()
    if (homeWindow !== null) {
      this.activeWindow(homeWindow)
    } else {
      homeWindow = this.createWindow({
        path: '',
        width: 800,
        height: 600,
        title: 'nas_client',
        webPreferences: {
          nodeIntegration: true
        }
      })
    }
    homeWindow.on('closed', () => {
      homeWindow = null
    })
    return homeWindow
  }
}
