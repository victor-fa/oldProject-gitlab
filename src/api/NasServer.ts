import _ from 'lodash'
import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios'
import store from '@/store'
import { NasAccessInfo, CryptoInfo } from './ClientModel'
import { EventBus, EventType } from '@/utils/eventBus'
import { BasicResponse } from './UserModel'
import ClientAPI from './ClientAPI'
import router from '@/router'
import processCenter, { EventName } from '@/utils/processCenter'

const nasServer = axios.create({
  timeout: 10000,
  withCredentials: false
})
const getApiToken = () => {
  const nasAccess = _.get(store.getters, 'NasServer/accessInfo') as NasAccessInfo
  const apiToken = nasAccess.api_token
  if (_.isEmpty(apiToken)) return null
  return apiToken
}
const getRefreshToken = () => {
  const accessInfo = _.get(store.getters, 'NasServer/accessInfo') as NasAccessInfo
  const token = accessInfo.refresh_token
  if (_.isEmpty(token)) return null
  return token
}
const setApiToken = (config: AxiosRequestConfig) => {
  const apiToken = getApiToken()
  if (apiToken === null) return config
  if (_.isEmpty(config.params)) {
    config.params = { api_token: apiToken }
  } else {
    config.params.api_token = apiToken
  }
  return config
}

nasServer.interceptors.request.use((config) => {
  // Do something before request is sent
  return setApiToken(config)
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
})

nasServer.interceptors.response.use((response: AxiosResponse) => {
  // handle response exception scene
  if (response.config.responseType === 'arraybuffer') {
    return response
  }
  return handleExceptionSence(response)
}, (error: AxiosError) => {
  // Do something with response error
  handleErrorResponse(error)
  return Promise.reject(error)
})

const refreshTokenCodes = [8024, 8013]
const reconnectCodes = [8044, 8045]
const reloginCodes = [8052]
const formattingCodes = [4060]
const reloginEncryptCodes = [8048, 8049]
const whiteListCodes = [8031, 8032, 8025, 8072, 8071, 8063]
const whiteListPaths = ['/v1/file/backup/upload', '/v1/file/upload', ' /v1/crypto/upload', '/download', '/v1/crypto/download', '/v1/user/security/logout']
const handleExceptionSence = (response: AxiosResponse) => {
  if (response.status === 200) {
    const basicData = response.data as BasicResponse
    const url = response.config.url === undefined ? '' : response.config.url
    if (refreshTokenCodes.indexOf(basicData.code) !== -1) {
      return handleTokenExpiredSence(response)
    } else if (reconnectCodes.indexOf(basicData.code) !== -1) {
      handleReconnectSence(basicData)
    } else if (reloginCodes.indexOf(basicData.code) !== -1) {
      handleReLoginSence()
    } else if (reloginEncryptCodes.indexOf(basicData.code) !== -1) {
      handleReloginEnceypt(basicData.code)
    } else if (formattingCodes.indexOf(basicData.code) !== -1) {
      EventBus.$emit(EventType.showToast, '磁盘正在初始化')
    } else if (whiteListCodes.indexOf(basicData.code) !== -1) {
      // EventBus.$emit(EventType.showToast, basicData.msg)
    } else if (whiteListPaths.indexOf(url) !== -1) {
      // filter path
    } else if (basicData.code !== 200 && !_.isEmpty(basicData.msg)) {
      EventBus.$emit(EventType.showToast, basicData.msg) 
    }
    // not intercept correct response
  } else {
    EventBus.$emit(EventType.showToast, response.statusText)
  }
  return response
}
const handleTokenExpiredSence = (aResponse: AxiosResponse) => {
  const refreshToken = getRefreshToken()
  if (refreshToken === null) {
    handleReconnectSence(aResponse.data)
    return aResponse
  }
  return ClientAPI.refreshAccessToken(refreshToken).then(response => {
    if (response.data.code !== 200) return Promise.resolve(response)
     // update nasToken cache
     const nasToken = _.get(store.getters, 'NasServer/accessInfo') as NasAccessInfo
     const newNasToken = _.cloneDeep(nasToken)
     newNasToken.api_token = _.get(response.data.data, 'api_token')
     newNasToken.refresh_token = _.get(response.data.data, 'refresh_token')
     store.dispatch('NasServer/updateNasAccess', newNasToken)
     // update config header
     _.set(aResponse.config.params, 'api_token', `${newNasToken.api_token}`)
     return axios.request(aResponse.config)
  })
}
const hasLoginWindow = () => {
  const matched = router.currentRoute.matched
  let isLoginWindow = false
  for (let index = 0; index < matched.length; index++) {
    const element = matched[index]
    if (element.name === 'login-layout') {
      isLoginWindow = true
      break
    }
  }
  return isLoginWindow
}
const handleReconnectSence = (data: BasicResponse) => {
  const isLoginWindow = hasLoginWindow()
  if (isLoginWindow) {
    if (router.currentRoute.name !== 'connecting') {
      router.replace('connecting')
    }
    EventBus.$emit(EventType.showToast, data.msg)
  } else {
    processCenter.renderSend(EventName.connecting, data.msg)
  }
}
const handleReLoginSence = () => {
  const isLoginWindow = hasLoginWindow()
  if (isLoginWindow && router.currentRoute.name === 'login') return
  showKickedDialog().then(() => {
    if (isLoginWindow) {
      router.replace('login')
    } else {
      processCenter.renderSend(EventName.login)
    }
  })
}
const handleReloginEnceypt = (code: number) => {
  const msg = code === 8048 ? '加密token无效' : '加密token过期'
  EventBus.$emit(EventType.reloginEncrypt, msg)
}
const showKickedDialog = () => {
  return new Promise((resolve) => {
    const { dialog } = require('electron').remote
    dialog.showMessageBox({
      title: '绿联云',
      message: '您的帐号在另一设备登录，已被迫下线。\n如非您本人操作，那么您的密码有可能已泄露，建议您修改密码',
      buttons: ['确定'],
      defaultId: 0,
      cancelId: 0
    }).then(() => {
      resolve()
    })
  })
}

const handleErrorResponse = (error: AxiosError) => {
  if (_.isEmpty(error.config)) return
  if (error.config.url === '/v1/selfcheck/heartbeat') return
  ClientAPI.heartbeat().catch(error => {
    EventBus.$emit(EventType.disconnect)
  })
}

export {
  nasServer
}
