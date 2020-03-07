import Vue from 'vue'

const nasFileModulePath = '/v1/file'

export default {
  storages () {
    return Vue.axios.get('http://192.168.10.91:9999' + nasFileModulePath + '/storages', {
      params: {
        'api_token': 'NWMwNGRiMjVlYWYwNmU0N2FkZWU0NTQ1ZjZiNTQyNWZlNGFiYTVkOA=='
      }
    })
  },
  list (path: string, uuid: string) {
    return Vue.axios.get('http://192.168.10.91:9999' + nasFileModulePath + '/list', {
      params: {
        path,
        uuid,
        'api_token': 'NWMwNGRiMjVlYWYwNmU0N2FkZWU0NTQ1ZjZiNTQyNWZlNGFiYTVkOA=='
      }
    })
  }
}
