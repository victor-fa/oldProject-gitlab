import _ from 'lodash'
import axios, { AxiosResponse, Canceler } from 'axios'
import { SmsType, AccessToken, BasicResponse, User, DeviceInfo } from './UserModel'
import deviceMgr from '@/utils/deviceMgr'
import store from '@/store'
import { nasCloud } from './CloudServer'
import crypto from 'crypto'

const userModule = '/api/user/v1'
const deviceModule = '/api/device/v1'
const CancelToken = axios.CancelToken
let cancel: Canceler | null = null
type CloudResponse = Promise<AxiosResponse<BasicResponse>>

const getAccessToken = () => {
  const userAccess = _.get(store.getters, 'User/accessToken') as AccessToken
  const accessToken = userAccess.access_token
  if (_.isEmpty(accessToken)) return null
  return accessToken
}
const getUserInfo = () => {
  const user = _.get(store.getters, 'User/user') as User
  if (_.isEmpty(user)) return null
  return user
}
const customError = (error: string): AxiosResponse<BasicResponse> => {
  return {
    status: 200,
    statusText: '',
    headers: null,
    config: {},
    data: {
      code: 9904, // 尚未登录
      msg: error,
      data: null
    }
  }
}

export default {
  ping (): CloudResponse {
    return nasCloud.get(userModule + '/msg')
  },
  smsCode (phone: string, smsType: SmsType): CloudResponse {
    return nasCloud.post(userModule + '/sendSms', {
      phone,
      smsType
    })
  },
  smsShortCode (phone: string, smsType: SmsType, sn: string, mac: string): CloudResponse {
    return nasCloud.post(userModule + '/send/short/sms', {
      phone,
      smsType,
      sn,
      mac
    })
  },
  register (phoneNo: string, password: string, code: string): CloudResponse {
    return nasCloud.post(userModule + '/reg/phone', {
      phoneNo,
      password,
      code
    })
  },
  login (userName: string, password: string): CloudResponse {
    const platform = deviceMgr.getPlatform()
    return nasCloud.post(userModule + '/login', {
      userName,
      password,
      platform
    })
  },
  fetchBindDevices (): CloudResponse {
    const accessToken = getAccessToken()
    if (accessToken === null) return Promise.reject(customError('not find access_token'))
    return nasCloud.get(userModule + '/bind/device', {
      headers: { 'Authorization': accessToken },
      cancelToken: new CancelToken(function executor(c) {
        cancel = c
      })
    })
  },
  unbindDevice (device: DeviceInfo): CloudResponse {
    const user = _.get(store.getters, 'User/user') as User
    const timestamp = (new Date()).getDate()
    const plaintext = `${device.mac}${device.sn}${timestamp}UGN123NAS@#$`
    const sign = crypto.createHash('SHA256').update(plaintext).digest('hex')
    return nasCloud.post(deviceModule + '/device/user', {
      sn: device.sn,
      mac: device.mac,
      timestamp,
      sign,
      ugreenNo: user.ugreenNo,
      isAdmin: device.role
    })
  },
  fetchUserInfo (): CloudResponse {
    const accessToken = getAccessToken()
    if (accessToken === null) return Promise.reject(customError('not find access_token'))
    return nasCloud.post(userModule + '/detail', {}, {
      headers: { 'Authorization': accessToken }
    })
  },
  cancelFetchBindDevices () {
    if (cancel !== null) cancel()
  },
  loginBySmscode (phoneNo: string, vcode: string) {
    return nasCloud.post(userModule + '/login/byCode', {
      phoneNo,
      vcode
    })
  },
  logout (): CloudResponse {
    const accessToken = getAccessToken()
    if (accessToken === null) return Promise.reject(customError('not find access_token'))
    return nasCloud.post(userModule + '/logout', {}, {
      headers: { 'Authorization': accessToken }
    })
  },
  refreshToken (refreshToken: string): CloudResponse {
    return nasCloud.get(userModule + '/token/refresh', {
      params: {
        refreshToken
      }
    })
  },
  feedback (title: string, context: string, linkUrl: string): CloudResponse {
    const user = getUserInfo()
    if (user === null)  return Promise.reject(customError('not find user_info'))
    const accessToken = getAccessToken()
    if (accessToken === null) return Promise.reject(customError('not find access_token'))
    return nasCloud.post(userModule + '/feedback/feedbacks', {
      ugreenNo: user.ugreenNo,
      title,
      linkUrl,
      contAddr: user.phoneNo,
      type: 1,
      context
    }, {
      headers: { 'Authorization': accessToken }
    })
  },
  updateInfo (data) {
    const accessToken = getAccessToken()
    if (accessToken === null) return Promise.reject(customError('not find access_token'))
    return nasCloud.put(userModule + '/update/info', {
      sex: data.sex,
      nicName: data.nicName,
      userSay: data.userSay,
      birthday: data.birthday,
      phoneNo: data.phoneNo,
      image: data.image,
      code: data.code
    }, {
      headers: { 'Authorization': accessToken }
    })
  },
  uploadPhoto (file) {
    const accessToken = getAccessToken()
    if (accessToken === null) return Promise.reject(customError('not find access_token'))
    const fd = new FormData()
    fd.append('image', file)
    return nasCloud.post(userModule + '/head/upload', fd, {
      headers: { 'Authorization': accessToken }
    })
  },
  changePass (data) {
    return nasCloud.post(userModule + '/resetPwd', {
      userName: data.userName,
      password: data.password,
      code: data.code
    })
  },
  updatePass (data) {
    return nasCloud.post(userModule + '/updatePwd', {
      pwd: data.pwd,
      newPwd: data.newPwd
    })
  },
  emailCode (email) {
    const accessToken = getAccessToken()
    if (accessToken === null) return Promise.reject(customError('not find access_token'))
    return nasCloud.get(userModule + '/send/email/vcode', {
      params: {
        email,
        emailType: 'bindEmail'
      },
      headers: { 'Authorization': accessToken }
    })
  },
  changeEmail (data) {
    const accessToken = getAccessToken()
    if (accessToken === null) return Promise.reject(customError('not find access_token'))
    return nasCloud.put(userModule + '/update/info', {
      email: data.email,
      code: data.code
    }, {
      headers: { 'Authorization': accessToken }
    })
  },
  fetchQrCode (): CloudResponse {
    return nasCloud.get(userModule + '/generate/qrcode', {
      params: {
        deviceType: 'pc'
      }
    })
  },
  fetchQrCodeLogin (qrCode: string): CloudResponse {
    return nasCloud.post(userModule + '/basic/qrCode/login', { qrCode })
  },
  fetchSoftVerUpdateInfo (appNo: string, versionNo: number): CloudResponse {
    return nasCloud.post(deviceModule + '/softVer/latest', { appNo, versionNo })
  },
  checkPhoneNumber (phone: string): CloudResponse {
    return nasCloud.post(userModule + '/check/info', { phoneNo: phone })
  } 
}
