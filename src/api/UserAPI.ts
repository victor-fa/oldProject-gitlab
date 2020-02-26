import Vue from 'vue'
import { AxiosResponse } from 'axios'
import { ACCESS_TOKEN } from '../common/constants'

const userModulePath = '/api/user/v1'

enum SmsType {
  login = 1,
  register,
  resetPassword,
  unbind,
  bind,
  changePhone
}

interface User {
  uid: string,
  nasNo: string,
  userName: string,
  nickName: string,
  birthday: number,
  sex: number,
  areaNo: string,
  phoneNo: string,
  image: string,
  userSay: string,
  status: number,
  versionNo: string,
  email: string,
  ctime: Date,
  utime: Date
}

interface AccessToken {
  accessToken: string,
  refreshToken: string,
  expiresTime: string
}

interface LoginResponse {
  accessToken: AccessToken,
  user: User
}

export {
  SmsType
}

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
  login (userName: string, password: string): Promise<AxiosResponse<LoginResponse>> {
    const plateForm = process.platform
    return Vue.axios.get(userModulePath + '/login', {
      params: {
        userName,
        password,
        plateForm
      },
      transformResponse: [data => {
        let newData: LoginResponse = data
        newData.accessToken.accessToken = data.accessToken['access_token']
        newData.accessToken.refreshToken = data.accessToken['refresh_token']
        newData.accessToken.expiresTime = data.accessToken['expires_time']
        return newData
      }]
    })
  },
  logout () {
    return Vue.axios.get(userModulePath + '/logout', {
      headers: { 'Authorization': localStorage.getItem(ACCESS_TOKEN) }
    })
  },
  resetPassword (userName: string, password: string, code: string) {
    return Vue.axios.post(userModulePath + '/resetPwd', {
      userName,
      password,
      code
    })
  }
}
