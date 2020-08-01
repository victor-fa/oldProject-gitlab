import _ from 'lodash'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { BasicResponse, AccessToken } from '@/api/UserModel'
import router from '@/router'
import { EventBus, EventType } from '@/utils/eventBus'
import processCenter, { EventName } from '@/utils/processCenter'
import store from '@/store'
import UserAPI from './UserAPI'

const nasCloudIP = 'http://cloud2.ugreengroup.com'
// const nasCloudIP = 'http://cloud.ugreengroup.com'

const nasCloud = axios.create({
  baseURL: nasCloudIP,
  timeout: 10000,
  withCredentials: false
})

nasCloud.interceptors.request.use((config) => {
  // Do something before request is sent
  return config
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
})

nasCloud.interceptors.response.use((response: AxiosResponse) => {
  // handle response exception scene
  return handleInterceptResponse(response)
}, (error: AxiosError) => {
  // Do something with response error
  return Promise.reject(error)
})

const refreshTokenCodes = [401, 9902]
const reLoginCodes = [9903, 9904, 9906]
const whiteListCodes = [8003]
const handleInterceptResponse =  (response: AxiosResponse<BasicResponse>) => {
  if (response.status === 200) {
    const basicData = response.data as BasicResponse
    if (refreshTokenCodes.indexOf(basicData.code) !== -1) {
      return handleTokenExpiredSence(response)
    } else if (reLoginCodes.indexOf(basicData.code) !== -1) {
      handleReloginSence(basicData)
    } else if (whiteListCodes.indexOf(basicData.code) !== -1) {
      // custom handle
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
    handleReloginSence(aResponse.data)
    return aResponse
  }
  return UserAPI.refreshToken(refreshToken).then(response => {
    if (response.data.code !== 200) return Promise.resolve(response)
    // update accessToken cache
    const token = _.get(response.data.data, 'accessToken') as AccessToken
    store.dispatch('User/updateAccessToken', token)
    // update config header
    _.set(aResponse.config.headers, 'Authorization', `${token.access_token}`)
    return axios.request(aResponse.config)
  })
}
const handleReloginSence = (data: BasicResponse) => {
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
      router.replace('login')
    }
    EventBus.$emit(EventType.showToast, data.msg)
  } else {
    processCenter.renderSend(EventName.login, data.msg)
  }
}
const getRefreshToken = () => {
  const userAccess = _.get(store.getters, 'User/accessToken') as AccessToken
  const token = userAccess.refresh_token
  if (_.isEmpty(token)) return null
  return token
}

export {
  nasCloud,
  nasCloudIP
}
