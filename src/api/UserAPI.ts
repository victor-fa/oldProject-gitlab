import { nasCloud } from '../utils/request'
import { AxiosResponse } from 'axios'
import { ACCESS_TOKEN } from '../common/constants'
import { SmsType, AccessToken, BasicResponse } from './UserModel'
import deviceMgr from '../utils/deviceMgr'

const userModulePath = '/api/user/v1'

export default {
  ping () {
    return nasCloud.get(userModulePath + '/msg')
  },
  smsCode (phone: string, smsType: SmsType) {
    return nasCloud.post(userModulePath + '/sendSms', {
      phone,
      smsType
    })
  },
  register (phoneNo: string, password: string, code: string) {
    return nasCloud.post(userModulePath + '/reg/phone', {
      phoneNo,
      password,
      code
    })
  },
  login (userName: string, password: string): Promise<AxiosResponse<BasicResponse>> {
    const platform = deviceMgr.getPlatform()
    return nasCloud.post(userModulePath + '/login', {
      userName,
      password,
      platform
    })
  },
  getBindDevices (): Promise<AxiosResponse<BasicResponse>> {
    const tokenJson = localStorage.getItem(ACCESS_TOKEN)
    if (tokenJson === null) {
      return Promise.reject(Error('not find access_token'))
    }
    const token = JSON.parse(tokenJson) as AccessToken
    return nasCloud.get(userModulePath + '/bind/device', {
      headers: { 'Authorization': token.access_token }
    })
  },
  loginBySmscode (phoneNo: string, vcode: string) {
    return nasCloud.post(userModulePath + '/login/byCode', {
      phoneNo,
      vcode
    })
  },
  logout (): Promise<AxiosResponse<BasicResponse>> {
    const tokenJson = localStorage.getItem(ACCESS_TOKEN)
    if (tokenJson === null) {
      return Promise.reject(Error('not find access_token'))
    }
    const token = JSON.parse(tokenJson) as AccessToken
    return nasCloud.get(userModulePath + '/logout', {
      headers: { 'Authorization': token.access_token }
    })
  },
  resetPassword (userName: string, password: string, code: string) {
    return nasCloud.post(userModulePath + '/resetPwd', {
      userName,
      password,
      code
    })
  },
  refreshToken (refreshToken: string): Promise<AxiosResponse<AccessToken>> {
    return nasCloud.get(userModulePath + '/token/refresh', {
      params: {
        refreshToken
      }
    })
  }
}
