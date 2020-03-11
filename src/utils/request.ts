import { EventBus, EventType } from './eventBus';
import Vue from 'vue'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { BasicResponse } from '@/api/UserModel'
import router from '@/router'
import processCenter, { EventName } from './processCenter';

const nasCloud = axios.create({
  baseURL: 'http://120.24.182.33',
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
  handleExceptionSence(response)
  return response
}, (error: AxiosError) => {
  // Do something with response error
  return Promise.reject(error)
})

const nasServer = axios.create({
  baseURL: 'http://113.116.244.115:1098',
  timeout: 10000,
  withCredentials: false
})

nasServer.interceptors.request.use((config) => {
  // Do something before request is sent
  return config
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
})

nasServer.interceptors.response.use((response: AxiosResponse) => {
  // handle response exception scene
  handleExceptionSence(response)
  return response
}, (error: AxiosError) => {
  // Do something with response error
  return Promise.reject(error)
})

const reLoginCodes = [9902, 9903, 9904, 9906]
const handleExceptionSence =  (response: AxiosResponse) => {
  if (response.status === 200) {
    const basicData = response.data as BasicResponse
    if (reLoginCodes.indexOf(basicData.code) >= 0) {
      handleReloginSence(basicData)
    } else if (basicData.code !== 200) {
      EventBus.$emit(EventType.showToast, basicData.msg)
    }
    // not interceptor correct response
  } else {
    console.log('inner error')
    EventBus.$emit(EventType.showToast, response.statusText)
  }
}

const handleReloginSence = (data: BasicResponse) => {
  const matched = router.currentRoute.matched
  let isLoginWindow = false
  for (let index = 0; index < matched.length; index++) {
    const element = matched[index]
    if (element.path.indexOf('login-layout') >= 0) {
      isLoginWindow = true
      break
    }
  }
  if (isLoginWindow) {
    if (router.currentRoute.path !== '/login') {
      router.replace('login')
    }
    EventBus.$emit(EventType.showToast, data.msg)
  } else {
    processCenter.renderSend(EventName.login)
  }
}

export {
  nasCloud,
  nasServer
}
