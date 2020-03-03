import Vue from 'vue'
import axios, { AxiosError, AxiosResponse } from 'axios'
import VueAxios from 'vue-axios'

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
axios.interceptors.response.use((response: AxiosResponse) => {
  // parse response data
  // if (response.status === 200) {
  //   // parse request data
  //   response.data = JSON.parse(response.data)
  // }
  return response
}, (error: AxiosError) => {
  // Do something with response error
  return Promise.reject(error)
})

Vue.use(VueAxios, axios)
