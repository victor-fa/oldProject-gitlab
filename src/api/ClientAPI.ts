import { AxiosResponse } from 'axios';
import _ from 'lodash'
import { nasServer, source } from '../utils/request'
import { User, BasicResponse } from './UserModel'
import deviceMgr from '../utils/deviceMgr'
import JSEncrypt from 'jsencrypt'
import { NasInfo } from './ClientModel'

const userModulePath = '/v1/user'
const tmpSecretKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzblv4FL7IukDs1m8bvw7wsIU5R1rUmq7RUMHroroY80zOSJZRn1eh8oW6fcrIZhZH+R7vWxvnKBe/h3cEJcUIRIKmQ26la5mAUuedghv1G38n3jZAXZ9yzslEQBBaKOYsvZz2F4KLhi2DlDLr/QOLpppH6HL7CDWaSyieXOmOVt/wmgHMl2SF1ko+bb/svVHz/7xTwoYJiyikVfSw1R+MlID+FLB/UkAPzopkadAUErPLZPMbXQrMelaUYbRQUTauh1dTg9g4nP72zMbW/06slpnswyAxCvxon8/E6U7pcsoBvOHCKyCmK0KO6keHr8ddgMjtV/+ZKmmPDkES51lKQIDAQAB
-----END PUBLIC KEY-----`

let client: any
export default {
  setBaseUrl (url: string) {
    nasServer.defaults.baseURL = url
  },
  // refresh_token过期时调用
  login (user: User, secretKey: string): Promise<AxiosResponse<BasicResponse>> {
    const userBasic = convertNasUser(user)
    const sign = encryptSign(userBasic, secretKey)
    console.log(sign);
    if (sign === null) return Promise.reject(Error('rsa encrypt error'))
    return nasServer.post(userModulePath + '/login', {
      platform: parseInt(deviceMgr.getPlatform()),
      user_basic: userBasic,
      sign
    })
  },
  offlineLogin (account: string, password: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/offline/login', {
      platform: parseInt(deviceMgr.getPlatform()),
      offline_username: account,
      offline_password: password
    })
  },
  bindUser (user: User, authCode: string): Promise<AxiosResponse<BasicResponse>> {
    const userBasic = convertNasUser(user)
    const params = authCode.length === 0 ? {
      platform: parseInt(deviceMgr.getPlatform()),
      user_basic: userBasic
    } : {
      platform: parseInt(deviceMgr.getPlatform()),
      user_basic: userBasic,
      auth_code: authCode
    }
    return nasServer.post(userModulePath + '/attach', params, {
      cancelToken: source.token
    })
  },
  cancelBindRequest () {
    source.cancel('Request canceled')
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
    this.searchNas('', '', success, failure)
  },
  // search nas on the LAN
  searchNas (sn: string, mac: string, success: (data: NasInfo) => void, failure: (error: string) => void) {
    const host = getBoardcastAddress()
    if (host === null) {
      failure('not found IP address')
      return
    }
    const dgram = require('dgram')
    client = dgram.createSocket('udp4')
    const msg = generateBoardcastPacket(sn, mac)
    console.log(`start boardcast: sn=${sn}, mac=${mac}`);
    const port = 60000
    client.bind(() => {
      client.setBroadcast(true)
      client.setTTL(128)
      client.send(msg, 0, msg.length, port, host, function(err) {
        if (_.isEmpty(err)) return
        console.log(err)
        // TODO: 广播报文发送失败，是否考虑重新发送
        failure('boardcast packet message failed')
      })
    })
    client.on('error', (error) => {
      console.log('socket error: ' + error)
      client.close()
      failure('socket error')
    })
    client.on('message', (msg: Buffer, rinfo) => {
      // parse reponse
      const dataJson = msg.toString('utf8')
      const data = JSON.parse(dataJson)
      console.log(data);
      if (data.error_code === 0) {
        success(data.data)
      } else {
        failure(data.msg)
      }
    })
  },
  closeBoardcast () {
    if (!_.isEmpty(client)) {
      client.close()
      client = null
    }
  },
  fetchBindUserList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModulePath + '/list')
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
  console.log(queryUser);
  console.log(secretKey);
  if (!_.isElement(queryUser)) {
    // 利用crypto模块实现RSA加密
    const jse = new JSEncrypt()
    queryUser = _.trimEnd(queryUser, '&')
    console.log(queryUser)
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
    const boardcast = netmask === 255 ? netmask : 255 - netmask
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
        const alias = interfaces[index];
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
