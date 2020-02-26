// 负责main process和render processes之间的通讯
import { ipcRenderer, ipcMain } from 'electron'
import windowManager from './windowManager'

enum ChannelName {
  async = 'asynchronous-message',
  sync = 'synchronous-message',
  replay = 'asynchronous-replay'
}

enum EventName {
  login = 'login'
}

export default {
  // on main process observing
  mainObserverChannel () {
    ipcMain.on(ChannelName.async, (event, eventName: EventName, data?: any) => {
      event.reply(ChannelName.replay)
      switch (eventName) {
        case EventName.login:
          windowManager.presentLoginWindow()
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
  // on render process send message
  renderSend (evnetName: EventName, ...args: any[]): void {
    ipcRenderer.send(ChannelName.async, evnetName, args)
  },
  renderSendSync (evnetName: EventName, ...args: any[]): any {
    return ipcRenderer.sendSync(ChannelName.sync, evnetName, args)
  }
}

export {
  EventName
}
