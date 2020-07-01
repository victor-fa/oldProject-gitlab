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
    console.log(userBasic)
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
    }, 10000)
    this.boardcastInLan('', '', data => {
      clearTimeout(timer)
      success(data)
    }, error => {
      clearTimeout(timer)
      failure(error)
    })
  },
  // search nas on the LAN
  searchNas (sn: string, mac: string): Promise<NasInfo> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.closeBoardcast()
        this.closeP2PTunnel()
        reject(Error('search time out'))
      }, 10000)
      this.boardcastInLan(sn, mac, data => {
        clearTimeout(timer)
        this.closeP2PTunnel()
        this.closeBoardcast()
        resolve(data)
      }, error => {
        console.log(error)
        this.closeBoardcast()
      })
      this.initP2PTunnel(sn, mac, data => {
        clearTimeout(timer)
        this.closeBoardcast()
        resolve(data)
      }, error => {
        console.log(error)
        this.closeP2PTunnel()
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
  /**启动P2P进程 */
  launchP2PProcess () {
  },
  initP2PTunnel (sn: string, mac: string, success: (data: NasInfo) => void, failure: (error: string) => void) {
    const tunnelNas = {
      sn,
      mac,
      ip: '127.0.0.1',
      port: 9001
    } as NasInfo
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
  },
  closeP2PTunnel () {
    TunnelAPI.deleteConnect().then(response => {
      if (response.status === 200) {
        console.log('close p2p tunnel completed')
      }
    })
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
    console.log(ciphertext)
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
