import Vue from 'vue'
import { SmsType } from './UserModel'

const nasUserModulePath = '/v1/user'
const tempServerUrl = 'http://192.168.10.91:9999'
const tempToken = 'YjkyMmZkZGQ1ZGE5Y2RmYTIyNGYxOTgzOWVlNDY0MTNjYjQ5YjdhMA=='

export default {
  attach () {
    return Vue.axios.get(tempServerUrl + nasUserModulePath + '/login/refresh', {
      params: {
        refresh_token: tempToken
      }
    })
  },
}
