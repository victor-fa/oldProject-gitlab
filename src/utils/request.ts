import Vue from 'vue'
import axios, { AxiosError, AxiosResponse } from 'axios'

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
  // parse response data
  // if (response.status === 200) {
  //   // parse request data
  //   const data = response.data as BasicResponse
  //   if (reLoginCodes.indexOf(data.code) >= 0) {
  //     handleTokenExpire(data)
  //   }
  // }
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
  // parse response data
  return response
}, (error: AxiosError) => {
  // Do something with response error
  return Promise.reject(error)
})

export {
  nasCloud,
  nasServer
}
