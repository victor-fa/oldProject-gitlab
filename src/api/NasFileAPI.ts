import Vue from 'vue'
import axios from 'axios/index';
import { NAS_ACCESS } from '@/common/constants'
axios.defaults.withCredentials = true;

const nasFileModulePath = '/v1/file'
const tempServerUrl = 'http://192.168.10.91:9999'

export default {
  storages () {
    const tokenJson = localStorage.getItem(NAS_ACCESS)
    if (tokenJson === null) {
      return Promise.reject(Error('not find access_token'))
    }
    const token = JSON.parse(tokenJson).api_token
    return Vue.axios.get(tempServerUrl + nasFileModulePath + '/storages', {
      params: {
        'api_token': token
      }
    })
  },
  list (path: string, uuid: string) {
    const tokenJson = localStorage.getItem(NAS_ACCESS)
    if (tokenJson === null) {
      return Promise.reject(Error('not find access_token'))
    }
    const token = JSON.parse(tokenJson).api_token
    return Vue.axios.get(tempServerUrl + nasFileModulePath + '/list', {
      params: {
        path,
        uuid,
        'api_token': token
      }
    })
  },
  upload (options) {
    console.log(options);
    let params = new URLSearchParams();
    let method = options.method ? options.method : 'POST';
    for (let item in options.data) {
      params.append(item, options.data[item]);
    }
    let body = new Blob([options.body]);
    return axios({
      method: method,
      data: body,
      withCredentials: true,
      url: tempServerUrl + '/v1/file/upload' + '?' + params,
      headers: {'Accept': '*/*'}
    }).then(
      response => {
        options.success && typeof options.success === 'function' ? options.success(response.data) : '';
      },
      function(error) {
        options.error && typeof options.error === 'function' ? options.error(error) : '';
      }
    );
  }
}
