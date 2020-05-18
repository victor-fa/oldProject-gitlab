// 负责main process和render processes之间的通讯
import { ipcRenderer, ipcMain, BrowserWindow } from 'electron'
import windowManager, { homeWindow } from './windowManager'

enum ChannelName {
  async = 'asynchronous-message',
  sync = 'synchronous-message',
  replay = 'asynchronous-replay'
}

// use in render process
enum EventName {
  login = 'present_login',
  connecting = 'present_connecting',
  home = 'present_home',
  file = 'present_file',
  mediaInfo = 'media_info',
  jump = 'jump_to_localtion',
  account = 'account_info',
  moveModal = 'presnet_move_modal',
  moveCallback = 'move_callback'
}

// use in main process
enum MainEventName {
  toast = 'show_toast',
  file = 'present_file',
  mediaInfo = 'media_info'
}

export default {
  // on main process observing
  mainObserverChannel () {
    ipcMain.on(ChannelName.async, (event, eventName: EventName, ...args: any[]) => {
      event.reply(ChannelName.replay)
      switch (eventName) {
        case EventName.login:
          windowManager.presentLoginWindow('login', args[0])
          break
        case EventName.connecting:
          windowManager.presentLoginWindow('connecting')
          break
        case EventName.home:
          windowManager.presentHomeWindow()
          break
        case EventName.mediaInfo:
          windowManager.presentMediaWindow(args[0])
          break
        case EventName.account:
          windowManager.refreshHomeWindow()
          break
        case EventName.moveModal: 
          windowManager.presentMoveModal()
          break
        case EventName.moveCallback:
          homeWindow!.webContents.send(EventName.moveCallback, ...args)
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
  renderObserver (eventName: MainEventName | EventName, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) {
    ipcRenderer.on(eventName, listener)
  },
  rednerObserverOnce (eventName: MainEventName | EventName, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) {
    ipcRenderer.once(eventName, listener)
  },
  //remove render process observer
  removeRenderObserver (eventName: MainEventName | EventName) {
    ipcRenderer.removeAllListeners(eventName)
  },
  // on render process send async message
  renderSend (evnetName: EventName, ...args: any[]): void {
    ipcRenderer.send(ChannelName.async, evnetName, ...args)
  },
  renderSendSync (evnetName: EventName, ...args: any[]): any {
    return ipcRenderer.sendSync(ChannelName.sync, evnetName, ...args)
  },
  // on render process send asynce message to render process
  renderSendTo (webContentsId: number, eventName: EventName, ...args: any[]) {
    ipcRenderer.sendTo(webContentsId, ChannelName.async, eventName, ...args)
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
