import _ from 'lodash'
import axios, { AxiosError, AxiosResponse } from 'axios'
import store from '@/store'
import { NasAccessInfo } from './ClientModel'
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

nasServer.interceptors.request.use((config) => {
  // Do something before request is sent
  const apiToken = getApiToken()
  if (apiToken === null) return config
  if (_.isEmpty(config.params)) {
    config.params = { api_token: apiToken }
  } else {
    config.params.api_token = apiToken
  }
  return config
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
  return Promise.reject(error)
})

const refreshTokenCodes = [8024, 8013]
const reconnectCodes = [8044, 8045]
const reLoginCodes = [8052]
const whiteListCodes = [8048, 8049, 40103, 4050, 8025]
const handleExceptionSence = (response: AxiosResponse) => {
  if (response.status === 200) {
    const basicData = response.data as BasicResponse
    if (refreshTokenCodes.indexOf(basicData.code) !== -1) {
      return handleTokenExpiredSence(response)
    } else if (reconnectCodes.indexOf(basicData.code) !== -1) {
      handleReconnectSence(basicData, false)
    } else if (reLoginCodes.indexOf(basicData.code) !== -1) {
      handleReconnectSence(basicData, true)
    } else if (whiteListCodes.indexOf(basicData.code) !== -1) {
      // EventBus.$emit(EventType.showToast, basicData.msg)
    } else if (basicData.code !== 200) {
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
    handleReconnectSence(aResponse.data, false)
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
const handleReconnectSence = (data: BasicResponse, isLogin: boolean) => {
  const matched = router.currentRoute.matched
  let isLoginWindow = false
  for (let index = 0; index < matched.length; index++) {
    const element = matched[index]
    if (element.name === 'login-layout') {
      isLoginWindow = true
      break
    }
  }
  if (isLoginWindow) {
    if (router.currentRoute.name !== 'login') {
      router.replace('connecting')
    }
    EventBus.$emit(EventType.showToast, data.msg)
  } else if (isLogin === true) {
    processCenter.renderSend(EventName.login, data.msg)
  } else {
    processCenter.renderSend(EventName.connecting)
  }
}

export {
  nasServer
}
