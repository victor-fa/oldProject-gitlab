import processCenter, { MainEventName } from '@/utils/processCenter'
import { BrowserWindow, Menu, Tray } from 'electron'
import windowControl from './windowControl'

interface WindowOptions extends Electron.BrowserWindowConstructorOptions {
  path: string
}

let loginWindow: BrowserWindow | null = null
let homeWindow: BrowserWindow | null = null
let mediaWindow: BrowserWindow | null = null
let moveWindow: BrowserWindow | null = null
let aboutWindow, feedBackWindow, settingWindow
let appTray:any = null;
const packageInfo = require('../../package.json')
const path = require('path');

export {
  homeWindow
}

export default {
  createWindow (options: WindowOptions): BrowserWindow {
    Menu.setApplicationMenu(null)
    let defaultOptions = {
      width: 800,
      height: 600,
			icon: './src/assets/logo.png',
      minWidth: 600,
      minHeight: 420,
      title: packageInfo.name,
      useContentSize: true,
      transparent: false,
      minimizable: true,
      maximizable: true,
      resizable: true,
      frame: false,
      show: false,
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
      if (!process.env.IS_TEST) window.webContents.openDevTools()
    } else {
      // Load the index.html when not in development
      window.loadURL('app://./index.html#/' + newOptions.path)
    }
    window.webContents.on('page-title-updated', () => {
      if (window !== null) {	// win环境
        window.setTitle(newOptions.title)
      }
    })
    return window
  },
  activeWindow (win: BrowserWindow): void {
    win.show()
    win.focus()
  },
  refreshWindow (win: BrowserWindow): void {
    win.reload()
  },
  closeOtherWindow (window: BrowserWindow): void {
    const wins = BrowserWindow.getAllWindows()
    for (let index = 0; index < wins.length; index++) {
      const win = wins[index]
      if (win !== window) win.close()
    }
  },
  presentLoginWindow (path: string, msg?: string): BrowserWindow {
    if (loginWindow !== null) {
      this.activeWindow(loginWindow)
    } else {
      loginWindow = this.createWindow({
        path,
        width: 420,
        height: 610,
        title: '登录',
        backgroundColor: '#f6f8fb',
        resizable: true
      })
    }
    loginWindow.on('closed', () => {
      loginWindow = null
    })
    loginWindow.on('ready-to-show', () => {
      this.activeWindow(loginWindow!)
      this.closeOtherWindow(loginWindow!)
      msg !== undefined && processCenter.mainSend(loginWindow!, MainEventName.toast, msg)
    })
    return loginWindow
  },
  presentHomeWindow (): BrowserWindow {
    if (homeWindow !== null) {
      this.activeWindow(homeWindow)
      return homeWindow
    } else {
      homeWindow = this.createWindow({
        path: 'home',
        width: 800,
        height: 600,
        backgroundColor: '#f6f8fb',
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
    // 托盘信息
		if (process.platform === 'win32') { // 仅当windows环境下需要托盘
      if (process.env.WEBPACK_DEV_SERVER_URL) { // 测试环境
        appTray = new Tray(path.join(__filename, '../../public/logo.ico'));
      } else {  // 生产环境
        appTray = new Tray(path.join(__dirname, '/logo.ico'));
      }
      let trayMenuTemplate = [
        {
          label: '打开绿联云',
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
            if (settingWindow) {
              return windowControl.active(settingWindow);
            }
            settingWindow = windowControl.create({
              url: 'disk-setting',
              icon: './src/assets/logo.png',
              title: '系统设置',
              width: 600,
              height: 400,
              minHeight: 350,
              minWidth: 500,
              maximizable: false,
              resizable: false,
              onclose: () => {
                settingWindow = null;
              }
            });
          }
        },
        {
          label: '关于',
          click: function() {
            if (aboutWindow) {
              return windowControl.active(aboutWindow);
            }
            aboutWindow = windowControl.create({
              url: 'disk-about',
              icon: './src/assets/logo.png',
              title: '关于uGgreen-Nas',
              width: 600,
              height: 330,
              maximizable: false,
              minimizable: false,
              resizable: false,
              onclose: () => {
                aboutWindow = null;
              }
            });
          }
        },
        {
          label: '反馈',
          click: function() {
            if (feedBackWindow) {
              return windowControl.active(feedBackWindow);
            }
            feedBackWindow = windowControl.create({
              url: 'disk-feedback',
              icon: './src/assets/logo.png',
              title: '问题反馈',
              width: 450,
              height: 320,
              maximizable: false,
              minimizable: false,
              resizable: false,
              onclose: () => {
                feedBackWindow = null;
              }
            });
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
		}

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
      backgroundColor: '#f6f8fb',
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
  },
  refreshHomeWindow () {
    if (homeWindow !== null) {
      this.refreshWindow(homeWindow)
    }
  },
  presentMoveModal () {
    if (moveWindow !== null) {
      this.activeWindow(moveWindow)
      return moveWindow
     }
    moveWindow = this.createWindow({
      path: 'move-modal',
      width: 465,
      height: 405,
      resizable: true,
      minimizable: false,
      maximizable: false,
      fullscreen: false,
      transparent: true,
      hasShadow: false,
      title: 'move-file',
      parent: homeWindow!,
      backgroundColor: '#00000000',
      modal: true,
      show: false
    })
    moveWindow.on('closed', () => {
      moveWindow = null
    })
    moveWindow.once('ready-to-show', () => {
      this.activeWindow(moveWindow!)
    })
    return moveWindow
  }
}
