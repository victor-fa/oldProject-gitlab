import { AxiosResponse } from 'axios';
import _ from 'lodash'
import { nasServer } from '../utils/request'
import { User, BasicResponse } from './UserModel'
import deviceMgr from '../utils/deviceMgr'
import JSEncrypt from 'jsencrypt'
import { NasInfo, NasUser } from './ClientModel'

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
    const sign = encryptSign(userBasic)
    if (sign === null) return Promise.reject(Error('rsa encrypt error'))
    return nasServer.post(userModulePath + '/login', {
      platform: deviceMgr.getPlatform(),
      user_basic: userBasic,
      sign
    })
  },
  offlineLogin (account: string, password: string, ugreenNo: string): Promise<AxiosResponse<BasicResponse>> {
    const ciphertext = encryptPassword(account, password, ugreenNo)
    return nasServer.post(userModulePath + '/offline/login', {
      platform: deviceMgr.getPlatform(),
      offline_username: account,
      offline_password: ciphertext
    })
  },
  bindUser (user: User, authCode: string): Promise<AxiosResponse<BasicResponse>> {
    const userBasic = convertNasUser(user)
    let params = authCode.length === 0 ? {
      platform: deviceMgr.getPlatform(),
      user_basic: userBasic
    } : {
      platform: deviceMgr.getPlatform(),
      user_basic: userBasic,
      auth_code: authCode
    }
    return nasServer.post(userModulePath + '/attach', params)
  },
  setOfflineAccount (account: string, password: string, apiToken: string, ugreenNo: string): Promise<AxiosResponse<BasicResponse>> {
    const ciphertext = encryptPassword(account, password, ugreenNo)
    return nasServer.post(userModulePath + '/offline/account/set', {
      offline_username: account,
      offline_password: ciphertext
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
  }
}

const convertNasUser = (user: User): NasUser => {
  return {
    ugreen_no: user.ugreenNo,
    phone_no: user.phoneNo,
    nic_name: user.nickName,
    email: user.email,
    sex: user.sex,
    birthday: user.birthday,
    version: user.versionNo
  }
}

const encryptSign = (nasUser: any, secretKey: string = tmpSecretKey) => {
  let queryUser = ''
  for (const key in nasUser) {
    if (nasUser.hasOwnProperty(key)) {
      const element = nasUser[key];
      if (element === null) continue
      queryUser = queryUser.concat(`${key}=${element}&`)
    }
  }
  if (!_.isElement(queryUser)) {
    // 利用crypto模块实现RSA加密
    const jse = new JSEncrypt()
    queryUser = queryUser.substring(0, queryUser.length - 1)
    jse.setPublicKey(secretKey)
    return jse.encrypt(queryUser) as string
  }
  return null
}

const encryptPassword = (account: string, password: string, ugreenNo: string) => {
  // 账号 + 密码 + ugreen_no
  const plaintext = account + password + ugreenNo
  const crypto = require('crypto')
  const md5 = crypto.createHash("md5")
  return md5.update(plaintext).digest('hex')
}

const getBoardcastAddress = () => {
  const address = getIPAddress()
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

const getIPAddress = () => {
  const os = require("os")
  const netInfo = os.networkInterfaces()
  for (const key in netInfo) {
    if (netInfo.hasOwnProperty(key)) {
      const interfaces = netInfo[key] as Array<any>
      for (let index = 0; index < interfaces.length; index++) {
        const alias = interfaces[index];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return { address: alias.address, netmask: alias.netmask }
        }
      }
    }
  }
  return null
}

// TODO: 创建字串处理工具类
// untility method for handle string
const replaceString = (str: string, char: string, replace: string) => {
  let tmpStr = ''
  for (let index = 0; index < str.length; index++) {
    const element = str.charAt(index)
    if (element !== char) {
      tmpStr = tmpStr.concat(element)
    } else {
      tmpStr = tmpStr.concat(replace)
    }
  }
  return tmpStr.length === 0 ? str : tmpStr
}

// 将aRadix进制的num字串转换成bRadix进制的数字
const conversionUtility = (num: string, aRadix: number, bRadix: number) => {
  return parseInt(num, aRadix).toString(bRadix)
}

const generateBoardcastPacket = (sn: string, mac: string) => {
  const code = Buffer.alloc(2)
  code.writeUIntBE(100, 0, 2)
  const msg = Buffer.from(`SN=${sn}&MAC=${mac}`)
  const msgLen = Buffer.alloc(2)
  msgLen.writeUIntBE(msg.length, 0, 2)
  return Buffer.concat([code, msgLen, msg])
}
