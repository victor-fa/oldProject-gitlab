import axios, { AxiosResponse, Canceler } from 'axios';
import _ from 'lodash'
import { User, BasicResponse } from './UserModel'
import deviceMgr from '../utils/deviceMgr'
import JSEncrypt from 'jsencrypt'
import { NasInfo } from './ClientModel'
import dgram from 'dgram'
import { nasServer } from './NasServer';
import TunnelAPI from './TunnelAPI';

const userModulePath = '/v1/user'

let client: dgram.Socket | null = null
const CancelToken = axios.CancelToken
let cancel: Canceler | null = null

export default {
  setBaseUrl (url: string) {
    nasServer.defaults.baseURL = url
  },
  // refresh_token过期时调用
  login (user: User, secretKey: string, tunnelIP?: string): Promise<AxiosResponse<BasicResponse>> {
    const userBasic = convertNasUser(user)
    const sign = encryptSign(userBasic, secretKey)
    if (sign === null) return Promise.reject(Error('rsa encrypt error'))
    return nasServer.post((tunnelIP ? `http://${tunnelIP}${userModulePath}` : userModulePath) + '/login', {
      platform: deviceMgr.getPlatform(),
      user_basic: userBasic,
      sign
    })
  },
  refreshAccessToken (refreshToken: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/login/refresh', undefined, {
      params: { refresh_token: refreshToken }
    })
  },
  offlineLogin (account: string, password: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/offline/login', {
      platform: deviceMgr.getPlatform(),
      offline_username: account,
      offline_password: password
    })
  },
  bindUser (user: User, authCode?: string): Promise<AxiosResponse<BasicResponse>> {
    const userBasic = convertNasUser(user)
    const params = authCode === undefined ? {
      platform: deviceMgr.getPlatform(),
      user_basic: userBasic
    } : {
      platform: deviceMgr.getPlatform(),
      user_basic: userBasic,
      auth_code: authCode
    }
    return nasServer.post(userModulePath + '/attach', params, {
      cancelToken: new CancelToken(function executor(c) {
        cancel = c
      })
    })
  },
  cancelBindRequest () {
    if (cancel !== null) {
      cancel()
    }
  },
  setOfflineAccount (account: string, password: string, apiToken: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/offline/account/set', {
      offline_username: account,
      offline_password: password
    }, {
      params: {
        api_token: apiToken
      }
    })
  },
  // scan nas on LAN with UDP
  scanNas (success: (data: NasInfo) => void, failure: (error: string) => void) {
    const timer = setTimeout(() => {
      this.closeBoardcast()
      failure('boardcast time out')
    }, 5000)
    this.boardcastInLan('', '', data => {
      clearTimeout(timer)
      success(data)
    }, error => {
      clearTimeout(timer)
      failure(error)
    })
  },
  // search nas on the LAN
  searchNas (sn: string, mac: string, success: (data: NasInfo) => void, failure: (error: string) => void) {
    const timer = setTimeout(() => {
      this.closeBoardcast()
      this.closeP2PTunnel()
      failure('search time out')
    }, 5000)
    this.boardcastInLan(sn, mac, data => {
      clearTimeout(timer)
      this.closeP2PTunnel()
      success(data)
    }, error => {
      clearTimeout(timer)
      this.closeP2PTunnel()
      failure(error)
    })
    this.initP2PTunnel(sn, mac, data => {
      clearTimeout(timer)
      this.closeBoardcast()
      success(data)
    }, error => {
      clearTimeout(timer)
      this.closeBoardcast()
      failure(error)
    })
  },
  boardcastInLan (sn: string, mac: string, success: (data: NasInfo) => void, failure: (error: string) => void) {
    // const host = getBoardcastAddress()
    const host = '255.255.255.255'
    if (host === null) {
      failure('not found IP address')
      return
    }
    client = dgram.createSocket('udp4')
    const msg = generateBoardcastPacket(sn, mac)
    console.log(`start boardcast: sn=${sn}, mac=${mac}`);
    const port = 60000
    client.bind(() => {
      client!.setBroadcast(true)
      client!.setTTL(128)
      client!.send(msg, 0, msg.length, port, host, function(err) {
        if (_.isEmpty(err)) return
        console.log(err)
        failure('boardcast packet message failed')
      })
    })
    client.on('error', (error) => {
      console.log('socket error: ' + error)
      failure('socket error')
    })
    client.on('message', (msg: Buffer, rinfo) => {
      // parse reponse
      const dataJson = msg.toString('utf8')
      const data = JSON.parse(dataJson)
      console.log(JSON.parse(JSON.stringify(data)));
      if (data.error_code === 0) {
        success(data.data)
      } else {
        failure(data.msg)
      }
    })
  },
  initP2PTunnel (sn: string, mac: string, success: (data: NasInfo) => void, failure: (error: string) => void) {
    if (process.platform === 'win32') { // 仅当windows平台先有
      const tunnelNas:NasInfo = {
        active: 1,
        name: '',
        model: '',
        mac: '',
        ip: '127.0.0.1',
        sn: '',
        port: 9001,
        ssl_port: '000',
        softversion: 'V1.0.1'
      }
      TunnelAPI.tunnelCheck().then(() => {
        return TunnelAPI.queryConnectInfo(sn)
      }).then((connectRes: any) => {
        if (connectRes.result === '0') {
          return Promise.resolve(tunnelNas)
        } else if (connectRes.result === '18') {
          return TunnelAPI.addConnectFun(sn)
        } else {
          return Promise.reject(Error('tunnel error'))
        }
      }).then((addConnectRes: any) => {
        if (addConnectRes === tunnelNas) {
          return Promise.resolve(tunnelNas)
        } else if (addConnectRes.result === '0') {
          return TunnelAPI.getPeerinfoFun(sn)
        } else {
          return Promise.reject(Error('tunnel error'))
        }
      }).then(() => {
        success(tunnelNas)
      }).catch(error => {
        failure('tunnel error')
      })
    }
  },
  closeBoardcast () {
    if (client !== null) {
      client.close()
      client = null
    }
  },
  closeP2PTunnel () {
    TunnelAPI.closeConnect().then((res: any) => {
      if (res.result === '0') {
        console.log('关闭成功');
      }
    })
  },
  fetchBindUserList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/list')
  },
  fetchQrCode (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/login/qr/meta_info')
  },
  fetchQrCodeLogin (session: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/login/qr/try_connecting', {
      login_session: session
    })
  },
  detach (apiToken: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/common/detach', {
      clear_disk_files: 0,
    }, {
      params: {
        api_token: apiToken
      }
    })
  },
  getMac () {
    return getIPAddress('mac')
  }
}

const convertNasUser = (user: User) => {
  let nasUser = {
    ugreen_no: user.ugreenNo,
    phone_no: user.phoneNo,
    nic_name: user.nickName,
    version: user.versionNo
  }
  // filter property with null value
  for (const key in nasUser) {
    if (nasUser.hasOwnProperty(key)) {
      const element = nasUser[key]
      if (element === null || element === undefined) {
        nasUser[key] = ''
      }
    }
  }
  return nasUser
}

const encryptSign = (nasUser: any, secretKey: string) => {
  let queryUser = ''
  for (const key in nasUser) {
    if (nasUser.hasOwnProperty(key)) {
      const element = nasUser[key];
      if (element === null || element === undefined) {
        queryUser = queryUser.concat(`${key}=&`)
      } else {
        queryUser = queryUser.concat(`${key}=${element}&`)
      }
    }
  }
  if (!_.isElement(queryUser)) {
    // 利用crypto模块实现RSA加密
    const jse = new JSEncrypt()
    queryUser = _.trimEnd(queryUser, '&')
    jse.setPublicKey(secretKey)
    return jse.encrypt(queryUser) as string
  }
  return null
}

const getBoardcastAddress = () => {
  const address = getIPAddress('address')
  if (address === null) {
    console.log('not found IP address')
    return null
  }
  const ipAddrs = (address.address as string).split('.')
  const netmasks = (address.netmask as string).split('.')
  let boardcasts = ''
  for (let index = 0; index < ipAddrs.length; index++) {
    const ipAddr = parseInt(ipAddrs[index])
    const netmask = parseInt(netmasks[index])
    const network = ipAddr & netmask
    const reversemask = 255 - netmask
    const boardcast = network | reversemask
    boardcasts += `${boardcast}.` 
  }
  return _.trim(boardcasts, '.')
}

const getIPAddress = (flag: string) => {
  const os = require("os")
  const netInfo = os.networkInterfaces()
  for (const key in netInfo) {
    if (netInfo.hasOwnProperty(key)) {
      const interfaces = netInfo[key] as Array<any>
      for (let index = 0; index < interfaces.length; index++) {
        const alias = interfaces[index]
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          if (flag === 'address') { // 返回address以及netmask
            return { address: alias.address, netmask: alias.netmask }
          } else if (flag === 'mac') {  // 返回mac地址
            return alias.mac
          }
        }
      }
    }
  }
  return null
}

const generateBoardcastPacket = (sn: string, mac: string) => {
  const code = Buffer.alloc(2)
  code.writeUIntBE(100, 0, 2)
  const msg = Buffer.from(`SN=${sn}&MAC=${mac}`)
  const msgLen = Buffer.alloc(2)
  msgLen.writeUIntBE(msg.length, 0, 2)
  return Buffer.concat([code, msgLen, msg])
}
