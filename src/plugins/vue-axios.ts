import Vue from 'vue'
import axios, { AxiosError, AxiosResponse } from 'axios'
import VueAxios from 'vue-axios'

interface BasicResponse {
  msg: string,
  code: number,
  data: any
}

axios.defaults.baseURL = 'http://120.24.182.33'
axios.defaults.timeout = 10000
// axios.defaults.withCredentials = true
axios.interceptors.request.use((config) => {
  // Do something before request is sent
  return config
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
})
axios.interceptors.response.use((response: AxiosResponse<BasicResponse>) => {
  // parse response data
  // if (response.status === 200) {
  //   // parse reques data
  //   const data = response.data.data
  //   response.data = data
  // }
  return response
}, (error: AxiosError) => {
  // Do something with response error
  return Promise.reject(error)
})

Vue.use(VueAxios, axios)
