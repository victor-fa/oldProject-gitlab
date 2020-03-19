import processCenter, { MainEventName } from '@/utils/processCenter'
import { BrowserWindow, Menu } from 'electron'

interface WindowOptions extends Electron.BrowserWindowConstructorOptions {
  path: string
}

let loginWindow: BrowserWindow | null = null
let homeWindow: BrowserWindow | null = null
let mediaWindow: BrowserWindow | null = null
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
  closeOtherWindow (window: BrowserWindow | null): void {
    const wins = BrowserWindow.getAllWindows()
    for (let index = 0; index < wins.length; index++) {
      const win = wins[index]
      if (win !== window) win.close()
    }
  },
  presentLoginWindow (msg: string): BrowserWindow {
    if (loginWindow !== null) {
      this.activeWindow(loginWindow)
    } else {
      loginWindow = this.createWindow({
        path: 'login-layout',
        width: 800,
        height: 600,
        title: '登录',
        resizable: false
      })
    }
    loginWindow.on('closed', () => {
      loginWindow = null
    })
    loginWindow.on('show', () => {
      this.closeOtherWindow(loginWindow)
      processCenter.mainSend(loginWindow!, MainEventName.toast, msg)
    })
    return loginWindow
  },
  presentHomeWindow (): BrowserWindow {
    if (homeWindow !== null) {
      this.activeWindow(homeWindow)
    } else {
      homeWindow = this.createWindow({
        path: 'home',
        width: 800,
        height: 600,
        title: 'nas_client'
      })
    }
    homeWindow.on('closed', () => {
      homeWindow = null
    })
    homeWindow.on('show', () => {
      this.closeOtherWindow(homeWindow)
    })
    return homeWindow
  },
  presentMediaWindow (data: any) {
    if (mediaWindow !== null) {
     this.activeWindow(mediaWindow)
     return 
    }
    mediaWindow = this.createWindow({
      path: 'media-layout',
      width: 400,
      height: 450,
      resizable: true, // 暂时为true
      minimizable: false,
      title: 'meida'
    })
    mediaWindow.on('closed', () => {
      mediaWindow = null
    })
    mediaWindow.once('show', () => {
      processCenter.mainSend(mediaWindow!, MainEventName.mediaInfo, data)
    })
    return mediaWindow
  }
}
