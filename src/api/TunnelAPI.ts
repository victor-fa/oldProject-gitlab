import _ from 'lodash'
import axios, { AxiosResponse } from 'axios';
import { NasInfo } from './ClientModel'
import { spawn, exec } from 'child_process'

enum TunnelStatus {
  continue,
  stop
}

const tunnelServer = axios.create({
  baseURL: 'http://127.0.0.1:17881',
  timeout: 10000,
  withCredentials: false
})
const ipcRenderer = require('electron').ipcRenderer
const serverIP = '127.0.0.1:9999'
const clientIP = '127.0.0.1:9001'
let status = TunnelStatus.stop  // 默认关闭

export default {
  getClientIP () {
    return clientIP
  },
  // 获取状态
  getStatus (): Promise<AxiosResponse<any>> {
    return tunnelServer.get('/statusget?option=0')
  },
  // 获取版本
  getVersion (): Promise<AxiosResponse<any>> {
    return tunnelServer.get('/versionget')
  },
  // 关闭P2P隧道连接
  deleteConnect (): Promise<AxiosResponse<any>> {
    status = TunnelStatus.stop
    return tunnelServer.get(`/cnntlcldelete?clientaddr=${this.getClientIP()}`)
  },
  // 关闭隧道进程
  exitTunnel () {
    status = TunnelStatus.stop
    if (process.platform === 'win32') {
      // TODO: 区分win10、win7 win7【tskill ugreenTunnel.exe】
      exec('taskkill /F /IM ugreenTunnel.exe');
    } else {
      exec('killall pgTunnelStatic');
    }
  },
  // 查询连接
  queryConnect (peerid): Promise<AxiosResponse<any>> {
    return tunnelServer.get('/cnntquery', {
      params: {
        peerid,
        type: 0,
        encrypt: 0,
        listenaddr: serverIP,
        clientaddr: clientIP
      }
    })
  },
  // 添加连接
  addConnect (peerid): Promise<AxiosResponse<any>> {
    return tunnelServer.get('/cnntadd', {
      params: {
        peerid,
        type: 0,
        encrypt: 0,
        listenaddr: serverIP,
        clientaddr: clientIP
      }
    })
  },
  // 连接信息
  getPeerinfo (peerid): Promise<AxiosResponse<any>> {
    return tunnelServer.get(`/peerinfoget?peerid=${peerid}`)
  },
  // 控制隧道
  controlTunnel (): Promise<AxiosResponse<any>> {
    return tunnelServer.get(`/control?ctrl=0`)
  },
  // 检查是否有启动起来
  tunnelCheck () {
    return new Promise((resolve, reject) => {
      this.getStatus().then(response => {
        if (response.status !== 200) return
        console.log(response.data);
        const resJson = JSON.parse(response.data.substring(10, response.data.length))
        if (resJson.result === '0') {
          resolve(resJson)
        }
      }).catch(error => {
        reject(error)
      })
    })
  },
  // 关闭连接
  deleteConnectInfo () {
    return new Promise((resolve, reject) => {
      this.deleteConnect().then(response => {
        if (response.status !== 200) return
        console.log(response.data)
        const resJson:any = JSON.parse(response.data.substring(14, response.data.length))
        resolve(resJson)
      }).catch(error => {
        reject(error)
      })
    })
  },
  // 查询连接
  queryConnectInfo (sn: string) {
    return new Promise((resolve, reject) => {
      const peerid = `_DEV_${sn}@pptun.com`
      this.queryConnect(peerid).then(response => {
        console.log(response.data);
        if (response.status !== 200) {
          reject(new Error(response.statusText))
          return
        }
        const resJson:any = JSON.parse(response.data.substring(10, response.data.length))
        resolve(resJson)
      }).catch(error => {
        reject(error)
      })
    })
  },
  addConnectFun (sn: string) {  // 添加连接
    return new Promise((resolve, reject) => {
      const peerid = `_DEV_${sn}@pptun.com`
      this.addConnect(peerid).then(response => {
        if (response.status !== 200) return
        console.log(response.data);
        const resJson = JSON.parse(response.data.substring(8, response.data.length))
        resolve(resJson)
      }).catch(error => {
        reject(error)
      })
    })
  },
  getPeerinfoFun (nas: NasInfo): Promise<NasInfo> {  // 获取连接信息
    return new Promise((resolve, reject) => {
      this.loop(nas, resolve, reject)
    })
  },
  loop (nas: NasInfo, resolve: (nas: NasInfo) => void, reject: (reason: any) => void) {
    if (status === TunnelStatus.stop) {
      reject('tunnel cancel')
      return
    }
    const peerid = `_DEV_${nas.sn}@pptun.com`
    this.getPeerinfo(peerid).then(response => {
      console.log(response.data)
      if (response.status !== 200 || status === TunnelStatus.stop) {
        reject('tunnel error')
        return
      }
      const resJson = JSON.parse(response.data.substring(12, response.data.length))
      if (resJson.result === '0') {
        if (resJson.result === '6') {
          reject(nas)
          return
        }
        if (resJson.tunnelremote === '') {  // 获取到数据则进行登录操作
          this.loop(nas, resolve, reject)  // 递归调用
        } else {
          resolve(nas)
        }
      }
    }).catch(error => {
      reject(error)
    })
  },
  // 监听主进程返回的隧道启动结果
  watchTunnelLaunch () {
    ipcRenderer.on('tunnel', (event, arg) => {
      console.log(arg)
      arg === 1 ? status = TunnelStatus.continue : null // 仅当隧道进程启动成功时处理为成功
    })
  },
  // 检测进程
  checkTunnelProcess (): Promise<void> {
    return new Promise(resolve => {
      this.getVersion().then(() => {
        resolve()
      }).catch(error => {
        console.log(error)
        ipcRenderer.send('system', 'awaken-tunnel');
        this.watchTunnelLaunch()
        const timer = setInterval(() => {
          if (status === TunnelStatus.continue) {
            resolve()
            timer && clearInterval(timer)
          }
        }, 500)
      })
    })
  },
  generateNasInfo (sn: string, mac: string) {
    return {
      sn,
      mac,
      ip: '127.0.0.1',
      port: 9001,
      ssl_port: '000',
      softversion: 'V1.0.1'
    } as NasInfo
  },
  // 单独暴露出去的重连接口
  async reConnection (sn: string, mac: string) {
    status = TunnelStatus.continue
    const nas = this.generateNasInfo(sn, mac)
    return this.getPeerinfoFun(nas)
  },
  // 单独暴露出去给ClientAPI使用
  async initP2PTunnel (sn: string, mac: string) {
    status = TunnelStatus.continue
    const nas = this.generateNasInfo(sn, mac)
    return this.checkTunnelProcess().then(() => {
      return this.tunnelCheck()
    }).then(() => {
      return this.queryConnectInfo(sn)
    }).then((connectRes: any) => {
      if (connectRes.result === '0') {
        return Promise.resolve(nas)
      } else if (connectRes.result === '18') {
        return this.addConnectFun(sn)
      } else {
        return Promise.reject(Error('tunnel error'))
      }
    }).then((addConnectRes: any) => {
      if (addConnectRes === nas) {
        return Promise.resolve(nas)
      } else if (addConnectRes.result === '0') {
        return this.getPeerinfoFun(nas)
      } else {
        return Promise.reject(Error('tunnel error'))
      }
    })
  }
}
