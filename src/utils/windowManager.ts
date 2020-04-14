import processCenter, { MainEventName } from '@/utils/processCenter'
import { BrowserWindow, Menu, Tray } from 'electron'

interface WindowOptions extends Electron.BrowserWindowConstructorOptions {
  path: string
}

let loginWindow: BrowserWindow | null = null
let homeWindow: BrowserWindow | null = null
let mediaWindow: BrowserWindow | null = null
const packageInfo = require('../../package.json')
const path = require('path');

export default {
  createWindow (options: WindowOptions): BrowserWindow {
    Menu.setApplicationMenu(null)
    let defaultOptions = {
      width: 800,
      height: 600,
			icon: './src/assets/logo.png',
      minWidth: 600,
      minHeight: 450,
      title: packageInfo.name,
      useContentSize: false,
      transparent: false,
      minimizable: true,
      maximizable: true,
      resizable: true,
      frame: false,
      show: false,
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
  closeOtherWindow (window: BrowserWindow): void {
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
    loginWindow.on('ready-to-show', () => {
      this.activeWindow(loginWindow!)
      this.closeOtherWindow(loginWindow!)
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
    homeWindow.on('ready-to-show', () => {
      this.activeWindow(homeWindow!)
      this.closeOtherWindow(homeWindow!)
    })

    let appTray:any = null;
    appTray = new Tray(path.join(__filename, '../../public/logo.ico'));
    let trayMenuTemplate = [
      {
        label: '我的网盘',
        click: function() {
          if (homeWindow) {
            homeWindow.show();
            homeWindow.restore();
            homeWindow.focus();
          }
        }
      },
      {
        label: '系统设置',
        click: function() {
          console.log('系统设置')
        }
      },
      {
        label: '反馈',
        click: function() {
          console.log('反馈')
        }
      },
      {
        label: '关于',
        click: function() {
          console.log('关于')
        }
      },
      {
        label: '退出',
        click: function() {
          if (homeWindow) {
            homeWindow.show();
            homeWindow.focus();
            homeWindow.close();
          }
        }
      }
    ];
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    appTray.setToolTip('uGgreen-Nas');  // 设置此托盘图标的悬停提示内容
    appTray.setContextMenu(contextMenu);  // 设置此图标的上下文菜单
    appTray.on('click', function() {
      if (homeWindow) {
        homeWindow.isVisible() ? homeWindow.hide() : homeWindow.show();
      }
    });

    return homeWindow
  },
  presentMediaWindow (data: any) { // mediawindow 他应该是homewindow的子窗口
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
      title: 'meida',
      parent: homeWindow!
    })
    mediaWindow.on('closed', () => {
      mediaWindow = null
    })
    mediaWindow.once('ready-to-show', () => {
      this.activeWindow(mediaWindow!)
      processCenter.mainSend(mediaWindow!, MainEventName.mediaInfo, data)
    })
    return mediaWindow
  }
}
