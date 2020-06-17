import Vue from 'vue'
import axios, { AxiosError, AxiosResponse } from 'axios'
import VueAxios from 'vue-axios'
import { nasCloudIP } from '@/api/CloudServer'

const instance = axios.create({
  baseURL: nasCloudIP,
  timeout: 10000,
  withCredentials: true
})

instance.interceptors.request.use((config) => {
  // Do something before request is sent
  return config
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
})

instance.interceptors.response.use((response: AxiosResponse) => {
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

Vue.use(VueAxios, instance)
