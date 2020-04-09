import { EventBus, EventType } from './eventBus';
import _ from 'lodash'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { BasicResponse } from '@/api/UserModel'
import router from '@/router'
import processCenter, { EventName } from './processCenter';
import { NAS_ACCESS } from '@/common/constants'
import { message } from 'ant-design-vue'

const CancelToken = axios.CancelToken
const source = CancelToken.source()
const nasCloud = axios.create({
  baseURL: 'http://192.168.10.21',
  timeout: 10000,
  withCredentials: false
})
const apiToken = (() => {
  const tokenJson = localStorage.getItem(NAS_ACCESS)
    if (tokenJson === null) {
      console.log('not find access_token in localStorage')
      return null
    }
    return JSON.parse(tokenJson).api_token
})()

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
  if (_.isEmpty(config.params)) {
    config.params = { api_token: apiToken }
  } else if (!_.isEmpty(apiToken)) {
    config.params.api_token = apiToken
  }
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

// json对象转url参数
const jsonToParams = (options) => {
  let params = new URLSearchParams();
  if (options !== null) {
    for (let item in options) {
      params.append(item, options[item]);
    }
  }
  params.append('api_token', getToken()); // 每个url都添加token
  return params
}

// json对象转url参数
const jsonToParamsForPdf = (options) => {
  let params = '';
  params += 'api_token=' + getToken();
  if (options !== null) {
    for (let item in options) {
      params += '&' + item + '=' + options[item];
    }
  }
  console.log(params);
  return params
}

// 获取token
const getToken = () => {
  const tokenJson = localStorage.getItem(NAS_ACCESS)
  if (tokenJson === null) {
    return Promise.reject(Error('not find access_token'))
  }
  return JSON.parse(tokenJson).api_token
}

const isResponsePass = (rs) => {
  let flag = true;
  if (rs.data.code !== 200) {
    flag = false
    message.warning(rs.data.msg)
  }
  return flag
}

export {
  nasCloud,
  nasServer,
  jsonToParams,
  jsonToParamsForPdf,
  isResponsePass,
  source
}
