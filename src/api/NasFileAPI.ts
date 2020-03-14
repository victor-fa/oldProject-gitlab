import Vue from 'vue'
import axios from 'axios/index';
import { jsonToParams } from '../utils/request'
axios.defaults.withCredentials = true;

const nasFileModulePath = '/v1/file'
const tempServerUrl = 'http://192.168.10.91:9999'

export default {
  storages () {
    return Vue.axios.get(tempServerUrl + nasFileModulePath + '/storages?' + jsonToParams(null))
  },
  list (path: string, uuid: string) {
    return Vue.axios.get(tempServerUrl + nasFileModulePath + '/list?' + jsonToParams({
      path: path,
      uuid: uuid,
    }))
  },
  upload (options) {
    let body = new Blob([options.body]);
    return Vue.axios.post(tempServerUrl + nasFileModulePath + '/upload?' + jsonToParams(options.data), body, {
      headers: {'Accept': '*/*'}
    })
  },
  download (option) {
    const input = { uuid: option.uuid, path: option.path }
    return tempServerUrl + nasFileModulePath + '/download?' + jsonToParams(input)
  }
}
