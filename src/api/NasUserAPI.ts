import Vue from 'vue'
import { SmsType } from './UserModel'

const nasUserModulePath = '/v1/user'

export default {
  attach () {
    return Vue.axios.get('http://192.168.10.91:9999' + nasUserModulePath + '/login/refresh', {
      params: {
        refresh_token: 'NWMwNGRiMjVlYWYwNmU0N2FkZWU0NTQ1ZjZiNTQyNWZlNGFiYTVkOA=='
      }
    })
  },
}
