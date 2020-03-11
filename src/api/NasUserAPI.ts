import Vue from 'vue'
import { SmsType } from './UserModel'
import { NAS_ACCESS } from '@/common/constants'

const nasUserModulePath = '/v1/user'
const tempServerUrl = 'http://192.168.10.91:9999'
const tempToken = 'YjkyMmZkZGQ1ZGE5Y2RmYTIyNGYxOTgzOWVlNDY0MTNjYjQ5YjdhMA=='

export default {
  attach () {
    const tokenJson = localStorage.getItem(NAS_ACCESS)
    if (tokenJson === null) {
      return Promise.reject(Error('not find access_token'))
    }
    const token = JSON.parse(tokenJson).api_token
    return Vue.axios.get(tempServerUrl + nasUserModulePath + '/login/refresh', {
      params: {
        refresh_token: token
      }
    })
  },
}
