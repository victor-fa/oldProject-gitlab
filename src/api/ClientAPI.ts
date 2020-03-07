import { AxiosResponse } from 'axios';
import _ from 'lodash'
import { nasServer } from '../utils/request'
import { User, BasicResponse } from './UserModel'
import deviceMgr from '../utils/deviceMgr'
import JSEncrypt from 'jsencrypt'

const userModulePath = '/v1/user'
const tmpSecretKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzblv4FL7IukDs1m8bvw7
wsIU5R1rUmq7RUMHroroY80zOSJZRn1eh8oW6fcrIZhZH+R7vWxvnKBe/h3cEJcU
IRIKmQ26la5mAUuedghv1G38n3jZAXZ9yzslEQBBaKOYsvZz2F4KLhi2DlDLr/QO
LpppH6HL7CDWaSyieXOmOVt/wmgHMl2SF1ko+bb/svVHz/7xTwoYJiyikVfSw1R+
MlID+FLB/UkAPzopkadAUErPLZPMbXQrMelaUYbRQUTauh1dTg9g4nP72zMbW/06
slpnswyAxCvxon8/E6U7pcsoBvOHCKyCmK0KO6keHr8ddgMjtV/+ZKmmPDkES51l
KQIDAQAB
-----END PUBLIC KEY-----`
const jse = new JSEncrypt()

export default {
  login (userInfo: User, secretKey: string): Promise<AxiosResponse<BasicResponse>> {
    const userBasic = {
      ugreen_no: 1002,
      phone_no: '13512345679',
      nic_name: 'james2',
      email: 'james2@ug.com',
      sex: 1,
      birthday: null,
      version: 29
    }
    // const userBasic = {
    //   ugreen_no: userInfo.ugreenNo,
    //   phone_no: userInfo.phoneNo,
    //   nic_name: userInfo.nickName,
    //   email: userInfo.email,
    //   sex: userInfo.sex,
    //   birthday: userInfo.birthday,
    //   version: userInfo.versionNo
    // }
    const sign = encryptSign(userBasic)
    if (sign === null) return Promise.reject(Error('rsa encrypt error'))
    return nasServer.post(userModulePath + '/login', {
      platform: deviceMgr.getPlatform,
      user_basic: userBasic,
      sign
    })
  }
}

const encryptSign = (user: any, secretKey: string = tmpSecretKey) => {
  let queryUser = ''
  for (const key in user) {
    if (user.hasOwnProperty(key)) {
      const element = user[key];
      if (element === null) continue
      queryUser = queryUser.concat(`${key}=${element}&`)
    }
  }
  if (!_.isElement(queryUser)) {
    queryUser = queryUser.substring(0, queryUser.length - 1)
    jse.setPublicKey(secretKey)
    return jse.encrypt(queryUser) as string
  }
  return null
}
