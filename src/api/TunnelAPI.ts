import axios, { AxiosResponse } from 'axios';
import _ from 'lodash'

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
let status = TunnelStatus.continue

export default {
  getClientIP () {
    return clientIP
  },
  getTunnelStatus () {
    return status
  },
  changeStatusToStop () {
    status = TunnelStatus.stop
  },
  // 获取状态
  getStatus (): Promise<AxiosResponse<any>> {
    return tunnelServer.get('/statusget', {
      params: {
        option: 0
      }
    })
  },
  // 关闭P2P进程
  deleteConnect (): Promise<AxiosResponse<any>> {
    return tunnelServer.get(`/cnntlcldelete?clientaddr=${this.getClientIP()}`)
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
    return tunnelServer.get('/peerinfoget', {
      params: {
        peerid
      }
    })
  },
  // 检查是否有启动起来
  tunnelCheck () {
    return new Promise((resolve, reject) => {
      this.getStatus().then(response => {
        if (response.status !== 200) {
          ipcRenderer.send('system', 'awaken-tunnel');
          return
        }
        console.log(response.data);
        const resJson = JSON.parse(response.data.substring(10, response.data.length))
        if (resJson.result === '0') {
          resolve(resJson)
        } else {
          ipcRenderer.send('system', 'awaken-tunnel');
        }
      }).catch(error => {
        ipcRenderer.send('system', 'awaken-tunnel');
        reject(error)
      })
    })
  },
  // 关闭连接
  deleteConnectInfo () {
    return new Promise((resolve, reject) => {
      this.deleteConnect().then(response => {
        if (response.status !== 200) return
        console.log(response.data);
        const resJson:any = JSON.parse(response.data.substring(14, response.data.length))
        resolve(resJson)
      }).catch(error => {
        reject(error)
      })
    })
  },
  // 查询连接
  queryConnectInfo (sn) {
    return new Promise((resolve, reject) => {
      const peerid = `_DEV_${sn}@pptun.com`
      this.queryConnect(peerid).then(response => {
        if (response.status !== 200) return
        console.log(response.data);
        const resJson:any = JSON.parse(response.data.substring(10, response.data.length))
        resolve(resJson)
      }).catch(error => {
        reject(error)
      })
    })
  },
  addConnectFun (sn) {  // 添加连接
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
  getPeerinfoFun (sn) {  // 获取连接信息
    return new Promise((resolve, reject) => {
      const peerid = `_DEV_${sn}@pptun.com`
      this.loop(peerid, resolve, reject)
    })
  },
  loop (peerid, resolve, reject) {
    if (status !== TunnelStatus.continue) return
    this.getPeerinfo(peerid).then(response => {
      if (response.status !== 200) return
      console.log(response.data);
      const resJson = JSON.parse(response.data.substring(12, response.data.length))
      if (resJson.result === '0') {
        if (resJson.result === '6') {
          reject()
          return
        }
        if (resJson.tunnelremote === '') {  // 获取到数据则进行登录操作
          this.loop(peerid, resolve, reject)  // 递归调用
        } else {
          resolve()
        }
      }
    }).catch(error => {
      reject(error)
    })
  }
}

export {
  TunnelStatus
}
