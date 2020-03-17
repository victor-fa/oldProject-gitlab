import { BasicResponse } from '@/api/UserModel';
import Vue from 'vue'
import { jsonToParams, jsonToParamsForPdf } from '../utils/request'
import axios, { AxiosResponse } from 'axios/index';
import { NAS_ACCESS, NAS_INFO } from '@/common/constants'
import { nasServer } from '@/utils/request';
import { NasInfo } from './ClientModel';
import ClientAPI from './ClientAPI';
import { OrderType } from './NasFileModel';

axios.defaults.withCredentials = true;

const nasFileModulePath = '/v1/file'
const tempServerUrl = 'http://192.168.10.91:9999'

const apiToken = (() => {
  const tokenJson = localStorage.getItem(NAS_ACCESS)
    if (tokenJson === null) {
      console.log('not find access_token in localStorage')
      return null
    }
    return JSON.parse(tokenJson).api_token
})()
const host = (() => {
  const nasInfoJson = localStorage.getItem(NAS_INFO)
    if (nasInfoJson === null) {
      console.log('not find access_token in localStorage')
      return null
    }
    const nasInfo = JSON.parse(nasInfoJson) as NasInfo
    return `http://${nasInfo.ip}:${nasInfo.port}`
})()
ClientAPI.setBaseUrl(host!)

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
  addFile (body) {
    return Vue.axios.post(tempServerUrl + nasFileModulePath + '/add?' + jsonToParams(null), body)
  },
  download (option) {
    const input = { uuid: option.uuid, path: option.path }
    return tempServerUrl + nasFileModulePath + '/download?' + jsonToParams(input)
  },
  httpDownload (option) { // 针对pdf处理
    const input = { uuid: option.uuid, path: option.path }
    return tempServerUrl + nasFileModulePath + '/http_download?' + jsonToParamsForPdf(input)
  },
  fetchStorages (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/storages', {
      params: {
        api_token: apiToken
      }
    })
  },
  fetchResourceList (path: string, uuid: string, page: number, size: number, order: OrderType = OrderType.byNameDesc): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/list', {
      params: {
        path: path,
        uuid: uuid,
        page: page,
        size: size,
        order: order,
        api_token: apiToken
      }
    })
  },
  fetchRecentResourceList (path: string, uuid: string, page: number): Promise<AxiosResponse<BasicResponse>> {
    return this.fetchResourceList(path, uuid, page, 20, OrderType.ByModifyDesc)
  }
}
