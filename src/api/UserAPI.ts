import Vue from 'vue'
import { AxiosResponse } from 'axios'
import { ACCESS_TOKEN } from '../common/constants'
import { SmsType, AccessToken, BasicResponse } from './UserModel'

const userModulePath = '/api/user/v1'

export default {
  ping () {
    return Vue.axios.get(userModulePath + '/msg')
  },
  smsCode (phone: string, smsType: SmsType) {
    return Vue.axios.post(userModulePath + '/sendSms', {
      phone,
      smsType
    })
  },
  register (phoneNo: string, password: string, code: string) {
    return Vue.axios.post(userModulePath + '/reg/phone', {
      phoneNo,
      password,
      code
    })
  },
  login (userName: string, password: string): Promise<AxiosResponse<BasicResponse>> {
    const platform = process.platform
    return Vue.axios.post(userModulePath + '/login', {
      userName,
      password,
      platform
    })
  },
  loginBySmscode (phoneNo: string, vcode: string) {
    return Vue.axios.post(userModulePath + '/login/byCode', {
      phoneNo,
      vcode
    })
  },
  logout () {
    const tokenJson = localStorage.getItem(ACCESS_TOKEN)
    if (tokenJson === null) {
      console.log('not find access_token')
      return
    }
    const token = JSON.parse(tokenJson) as AccessToken
    return Vue.axios.get(userModulePath + '/logout', {
      headers: { 'Authorization': token.accessToken }
    })
  },
  resetPassword (userName: string, password: string, code: string) {
    return Vue.axios.post(userModulePath + '/resetPwd', {
      userName,
      password,
      code
    })
  },
  refreshToken (refreshToken: string): Promise<AxiosResponse<AccessToken>> {
    return Vue.axios.get(userModulePath + '/token/refresh', {
      params: {
        refreshToken
      }
    })
  }
}
