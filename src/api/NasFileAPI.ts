import Vue from 'vue'
import axios from 'axios/index';
axios.defaults.withCredentials = true;

const nasFileModulePath = '/v1/file'
const tempServerUrl = 'http://192.168.10.91:9999'
const tempToken = 'YjkyMmZkZGQ1ZGE5Y2RmYTIyNGYxOTgzOWVlNDY0MTNjYjQ5YjdhMA=='

export default {
  storages () {
    return Vue.axios.get(tempServerUrl + nasFileModulePath + '/storages', {
      params: {
        'api_token': tempToken
      }
    })
  },
  list (path: string, uuid: string) {
    return Vue.axios.get(tempServerUrl + nasFileModulePath + '/list', {
      params: {
        path,
        uuid,
        'api_token': tempToken
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
