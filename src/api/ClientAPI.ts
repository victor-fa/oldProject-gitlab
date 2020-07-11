import axios, { AxiosResponse, Canceler } from 'axios';
import _ from 'lodash'
import { User, BasicResponse } from './UserModel'
import deviceMgr from '@/utils/deviceMgr'
import { NasInfo } from './ClientModel'
import os from 'os'
import dgram from 'dgram'
import { nasServer } from './NasServer';
import TunnelAPI from './TunnelAPI'
import crypto from 'crypto'

const userModulePath = '/v1/user'
const selfCheck = '/v1/selfcheck'

let client: dgram.Socket | null = null
const CancelToken = axios.CancelToken
let cancel: Canceler | null = null
let timer: NodeJS.Timer | null = null

export default {
  setBaseUrl (url: string) {
    nasServer.defaults.baseURL = url
  },
  heartbeat (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(selfCheck + '/heartbeat')
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
    this.clearTimer()
    timer = setTimeout(() => {
      this.closeBoardcast()
      failure('boardcast time out')
    }, 10000)
    this.boardcastInLan('', '', data => {
      this.clearTimer()
      success(data)
    }, error => {
      this.clearTimer()
      this.closeBoardcast()
      failure(error)
    })
  },
  // search nas on the LAN
  searchNas (sn: string, mac: string): Promise<NasInfo> {
    return new Promise((resolve, reject) => {
      this.closeConnection()
      timer = setTimeout(() => {
        this.closeConnection()
        reject(Error('search time out'))
      }, 20000)
      this.boardcastInLan(sn, mac, data => {
        this.clearTimer()
        this.closeConnection()
        resolve(data)
      }, error => {
        console.log(error)
        this.closeBoardcast()
      })
      TunnelAPI.initP2PTunnel(sn, mac).then(data => {
        this.clearTimer()
        this.closeBoardcast()
        resolve(data)
      }).catch(error => {
        console.log(error)
        TunnelAPI.deleteConnect()
      })
    })
  },
  /**重新连接
   * notes: 重连没有超时限制
   */
  reconnectionToNas (sn: string, mac: string): Promise<NasInfo> {
    return new Promise((resolve, reject) => {
      this.closeConnection()
      timer = setTimeout(() => {
        this.closeConnection()
        reject(Error('reconnection time out'))
      }, 20000)
      this.boardcastInLan(sn, mac, data => {
        this.closeConnection()
        this.clearTimer()
        resolve(data)
      }, error => {
        console.log(error)
        this.closeBoardcast()
      })
      TunnelAPI.reConnection(sn, mac).then(nas => {
        this.closeConnection()
        this.clearTimer()
        resolve(nas)
      }).catch(error => {
        console.log(error)
        this.closeConnection()
      })
    })
  },
  boardcastInLan (sn: string, mac: string, success: (data: NasInfo) => void, failure: (error: string) => void) {
    const hosts = calculateBoardcastAddress()
    if (hosts === null) {
      failure('not found IP address')
      return
    }
    console.log(`start boardcast: sn=${sn}, mac=${mac}`);
    client = dgram.createSocket('udp4')
    const msg = generateBoardcastPacket(sn, mac)
    const port = 60000
    client.bind(() => {
      client!.setBroadcast(true)
      client!.setTTL(128)
      hosts.forEach(host => {
        console.log(host)
        client!.send(msg, 0, msg.length, port, host, function(err) {
          if (_.isEmpty(err)) return
          console.log(err)
          failure('boardcast packet message failed')
        })
      })
    })
    client.addListener('error', (error) => {
      console.log('socket error: ' + error)
      failure('socket error')
    })
    client.addListener('message', (msg: Buffer, rinfo) => {
      // parse reponse
      const dataJson = msg.toString('utf8')
      const data = JSON.parse(dataJson)
      if (data.error_code === 0) {
        success(data.data)
      } else {
        failure(data.msg)
      }
    })
  },
  closeBoardcast () {
    if (client !== null) {
      client.removeAllListeners()
      client.close()
      client = null
    }
  },
  clearTimer () {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  },
  closeConnection () {
    this.clearTimer()
    this.closeBoardcast()
    TunnelAPI.deleteConnect()
  },
  fetchQrCode (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/login/qr/meta_info')
  },
  fetchQrCodeLogin (session: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/login/qr/try_connecting', {
      login_session: session
    })
  },
  commonDetach (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/common/detach')
  },
  adminDetach (clearDisk: number): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/admin/detach', {
      clear_disk_files: clearDisk,
    })
  },
  getMac () {
    const infos = getNetworkInterfaces()
    if (_.isEmpty(infos)) return ''
    return infos[0].mac
  }
}

const convertNasUser = (user: User) => {
  let nasUser = {
    ugreen_no: user.ugreenNo,
    phone_no: user.phoneNo,
    nic_name: user.nicName,
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
    queryUser = _.trimEnd(queryUser, '&')
    const ciphertext = crypto.publicEncrypt({
      key: secretKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(queryUser)).toString('base64')
    return ciphertext
  }
  return null
}

// 计算广播地址
const calculateBoardcastAddress = () => {
  const infos = getNetworkInterfaces()
  if (_.isEmpty(infos)) return null
  return infos.map(info => {
    const ipAddrs = (info.address as string).split('.')
    const netmasks = (info.netmask as string).split('.')
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
  })
}

// 获取网口信息
const getNetworkInterfaces = () => {
  const netInfo = os.networkInterfaces()
  let infos: NetworkInfo[] = []
  for (const key in netInfo) {
    if (netInfo.hasOwnProperty(key)) {
      const interfaces = netInfo[key] as Array<any>
      for (let index = 0; index < interfaces.length; index++) {
        const alias = interfaces[index] as NetworkInfo
        if (alias.family !== 'IPv4') continue
        if (alias.address === '127.0.0.1') continue
        if (alias.internal) continue
        infos.push(alias)
      }
    }
  }
  return infos
}

const generateBoardcastPacket = (sn: string, mac: string) => {
  const code = Buffer.alloc(2)
  code.writeUIntBE(100, 0, 2)
  const msg = Buffer.from(`SN=${sn}&MAC=${mac}`)
  const msgLen = Buffer.alloc(2)
  msgLen.writeUIntBE(msg.length, 0, 2)
  return Buffer.concat([code, msgLen, msg])
}

interface NetworkInfo {
  address: string,
  cidr: string,
  family: string,
  internal: boolean,
  mac: string,
  netmask: string
  scopeid: number,
  boardcastAddress: string
}
