// 负责main process和render processes之间的通讯
import { ipcRenderer, ipcMain, BrowserWindow } from 'electron'
import windowManager from './windowManager'

enum ChannelName {
  async = 'asynchronous-message',
  sync = 'synchronous-message',
  replay = 'asynchronous-replay'
}

// use in render process
enum EventName {
  login = 'present_login',
  home = 'present_home'
}

// use in main process
enum MainEventName {
  toast = 'show_toast'
}

export default {
  // on main process observing
  mainObserverChannel () {
    ipcMain.on(ChannelName.async, (event, eventName: EventName, data: any) => {
      event.reply(ChannelName.replay)
      switch (eventName) {
        case EventName.login:
          const msg = data as string
          windowManager.presentLoginWindow(msg)
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
  // add render process observer
  renderObserver (eventName: MainEventName, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) {
    ipcRenderer.on(eventName, listener)
  },
  //remove render process observer
  removeRenderObserver (eventName: MainEventName) {
    ipcRenderer.removeAllListeners(eventName)
  },
  // on render process send async message
  renderSend (evnetName: EventName, ...args: any[]): void {
    ipcRenderer.send(ChannelName.async, evnetName, ...args)
  },
  renderSendSync (evnetName: EventName, ...args: any[]): any {
    return ipcRenderer.sendSync(ChannelName.sync, evnetName, ...args)
  },
  // on main process send async message
  mainSend (win: BrowserWindow, eventName: MainEventName, ...args: any[]): void {
    win.webContents.on('did-finish-load', () => {
      win.webContents.send(eventName, ...args)
    })
  }
}

export {
  EventName,
  MainEventName
}
