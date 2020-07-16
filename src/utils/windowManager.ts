import processCenter, { MainEventName } from '@/utils/processCenter'
import { BrowserWindow, Menu, Tray, app } from 'electron'
import windowControl from './windowControl'
import path from 'path'

interface WindowOptions extends Electron.BrowserWindowConstructorOptions {
  path: string
}

let loginWindow: BrowserWindow | null = null
let homeWindow: BrowserWindow | null = null
let mediaWindow: BrowserWindow | null = null
let moveWindow: BrowserWindow | null = null
let settingWindow: BrowserWindow | null = null
let initializeWindow: BrowserWindow | null = null
let updateWindow: BrowserWindow | null = null
let aboutWindow: BrowserWindow | null = null
let feedBackWindow: BrowserWindow | null = null
let newVersionWindow: BrowserWindow | null = null
let appTray:any = null

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
      title: 'nas_client',
      useContentSize: true,
      transparent: false,
      minimizable: true,
      maximizable: true,
      resizable: true,
      frame: false,
      show: false,
      scrollBounce: true,
      webPreferences: {
        nodeIntegration: true,
        webSecurity: false
      }
    }
    const newOptions = Object.assign(defaultOptions, options)
    if (process.platform === 'darwin') {
      newOptions.frame = true
      if (newOptions.titleBarStyle === undefined) newOptions.titleBarStyle = 'hiddenInset'
    }
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
      window.webContents.openDevTools()
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
  closeOtherWindow (window?: BrowserWindow) {
    const wins = BrowserWindow.getAllWindows()
    for (let index = 0; index < wins.length; index++) {
      const win = wins[index]
      if (win !== window) win.close()
    }
  },
  presentLoginWindow (path: string, msg?: string): BrowserWindow {
    process.platform === 'win32' ? appTray.destroy() : null    // 关闭系统托盘
    if (loginWindow !== null) {
      this.activeWindow(loginWindow)
    } else {
      loginWindow = this.createWindow({
        path,
        width: 420,
        height: 610,
        minWidth: 420,
        icon: './src/assets/logo.png',
        title: '登录',
        backgroundColor: '#f6f8fb',
        maximizable: false,
        resizable: false
      })
    }
    loginWindow.once('closed', () => {
      loginWindow!.removeAllListeners()
      loginWindow = null
    })
    loginWindow.once('ready-to-show', () => {
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
        minWidth: 800,
        height: 680,
        minHeight: 680,
        backgroundColor: '#f6f8fb',
        title: 'nas_client',
        resizable: true,
        titleBarStyle: 'hidden'
      })
    }
    homeWindow.once('closed', () => {
      homeWindow!.removeAllListeners()
      homeWindow = null
    })
    homeWindow.once('ready-to-show', () => {
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
          click: () => this.presentHomeWindow()
        },
        {
          label: '系统设置',
          click: () => this.presentSettingWindow()
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
              title: '关于绿联云',
              width: 600,
              height: 400,
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
          click: () => app.quit()
        }
      ];
      const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
      appTray.setToolTip('绿联云');  // 设置此托盘图标的悬停提示内容
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
      resizable: false,
      minimizable: false,
      title: 'meida',
      backgroundColor: '#f6f8fb'
    })
    mediaWindow.once('closed', () => {
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
  refreshSettingWindow () {
    if (settingWindow !== null) {
      this.refreshWindow(settingWindow)
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
    moveWindow.once('closed', () => {
      moveWindow = null
    })
    moveWindow.once('ready-to-show', () => {
      this.activeWindow(moveWindow!)
    })
    return moveWindow
  },
  presentSettingWindow () {
    if (settingWindow !== null) {
      this.activeWindow(settingWindow)
      return settingWindow
    }
    settingWindow = this.createWindow({
      path: 'system-setting',
      width: 680,
      height: 500,
      minWidth: 680,
      title: '系统设置',
      backgroundColor: '#f6f8fb',
      maximizable: true,
      transparent: false,
      resizable: true,
      show: false
    })
    settingWindow.once('closed', () => {
      settingWindow!.removeAllListeners()
      settingWindow = null
    })
    settingWindow.on('ready-to-show', () => {
      this.activeWindow(settingWindow!)
    })
  },
  presentInitializeWindow () {
    if (initializeWindow !== null) {
      this.activeWindow(initializeWindow)
      return initializeWindow
    }
    initializeWindow = this.createWindow({
      path: 'system-initialize',
      show: false,
      icon: './src/assets/logo.png',
      title: '磁盘正在初始化',
      maximizable: false,
      transparent: true,
      resizable: false,
      parent: homeWindow!,
      modal: true
    })
    initializeWindow.maximize() // 最大化
    initializeWindow.show() // 聚焦
    initializeWindow.once('closed', () => {
      initializeWindow!.removeAllListeners()
      initializeWindow = null
      this.refreshHomeWindow()
    })
    initializeWindow.once('ready-to-show', () => {
      settingWindow!.close()
      this.activeWindow(initializeWindow!)
      // 启动后，要将系统设置界面关闭
      settingWindow!.close()
    })
  },
  presentUpdateSoftWindow () {
    if (updateWindow !== null) {
      this.activeWindow(updateWindow)
      return updateWindow
    }
    updateWindow = this.createWindow({
      path: 'system-update',
      show: false,
      icon: './src/assets/logo.png',
      maximizable: false,
      transparent: true,
      resizable: false,
      parent: homeWindow!
    })
    updateWindow.maximize() // 最大化
    updateWindow.show() // 聚焦
    updateWindow.once('closed', () => {
      updateWindow!.removeAllListeners()
      updateWindow = null
    })
    updateWindow.once('ready-to-show', () => {
      this.activeWindow(updateWindow!)
    })
		updateWindow.webContents.session.on('will-download', (event, item, webContents) => {
			const savePath = path.join(app.getPath('downloads'), item.getFilename());
			item.setSavePath(savePath);
			item.on('updated', (event, state) => {
				if (state === 'interrupted') {
					console.log('Download is interrupted but can be resumed')
				} else if (state === 'progressing') {
					if (item.isPaused()) {
						console.log('Download is paused')
					} else {
            if (updateWindow !== null) {
              updateWindow.webContents.send('percent', (item.getReceivedBytes() / item.getTotalBytes()));
            }
					}
				}
			})
			item.once('done', (event, state) => {
				if (state === 'completed') {
					console.log('Download successfully')
					const { spawn } = require('child_process')
					spawn(savePath)	// 打开对应路径
				} else {
					console.log(`Download failed: ${state}`)
				}
			})
		})
  },
  uploadPackage (data) {
    if (updateWindow !== null) {
      updateWindow.webContents.downloadURL(data);
    }
  },
  presentNewVersionWindow (data: any) {
    if (newVersionWindow !== null) {
      this.activeWindow(newVersionWindow)
      return newVersionWindow
    }
    newVersionWindow = this.createWindow({
      path: 'disk-about',
      width: 600,
      height: 400,
      minWidth: 680,
      title: '版本更新',
      backgroundColor: '#f6f8fb',
      maximizable: false,
      transparent: false,
      resizable: false,
      parent: homeWindow!,
      show: false
    })
    newVersionWindow.once('closed', () => {
      newVersionWindow!.removeAllListeners()
      newVersionWindow = null
    })
    newVersionWindow.once('ready-to-show', () => {
      this.activeWindow(newVersionWindow!)
      processCenter.mainSend(newVersionWindow!, MainEventName.newVersionInfo, data)
    })
  }
}
