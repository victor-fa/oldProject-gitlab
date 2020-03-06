// 负责main process和render processes之间的通讯
import { ipcRenderer, ipcMain, BrowserWindow } from 'electron'
import windowManager from './windowManager'

enum ChannelName {
  async = 'asynchronous-message',
  sync = 'synchronous-message',
  replay = 'asynchronous-replay'
}

enum EventName {
  login = 'present_login',
  toast = 'show_toast',
  home = 'present_home'
}

export default {
  // on main process observing
  mainObserverChannel () {
    ipcMain.on(ChannelName.async, (event, eventName: EventName, data: any) => {
      event.reply(ChannelName.replay)
      switch (eventName) {
        case EventName.login:
          windowManager.presentLoginWindow()
          break
        case EventName.home:
          windowManager.presentHomeWindow()
          break
        default:
          break
      }
    })
    ipcMain.on(ChannelName.sync, (event, eventName: EventName, data: any) => {
      event.returnValue = 'returnValue'
      console.log(eventName)
    })
  },
  // on render process observing
  renderObserver (eventName: EventName, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) {
    const { ipcRenderer } = require('electron')
    ipcRenderer.on(eventName, listener)
  },
  // on render process send async message
  renderSend (evnetName: EventName, ...args: any[]): void {
    ipcRenderer.send(ChannelName.async, evnetName, ...args)
  },
  renderSendSync (evnetName: EventName, ...args: any[]): any {
    return ipcRenderer.sendSync(ChannelName.sync, evnetName, ...args)
  },
  // on main process send async message
  mainSend (win: BrowserWindow, eventName: EventName, ...args: any[]): void {
    win.webContents.on('did-finish-load', () => {
      win.webContents.send(eventName, ...args)
    })
  }
}

export {
  EventName
}
