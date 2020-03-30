import { ResourceItem } from '@/api/NasFileModel';
import { BasicResponse } from '@/api/UserModel';
import Vue from 'vue'
import { jsonToParams, jsonToParamsForPdf } from '../utils/request'
import axios, { AxiosResponse } from 'axios/index';
import { NAS_ACCESS, NAS_INFO } from '@/common/constants'
import { nasServer } from '@/utils/request';
import { NasInfo } from './ClientModel';
import { OrderType, UploadTimeSort } from './NasFileModel';

axios.defaults.withCredentials = true;

const nasFileModulePath = '/v1/file'
const nasTaskModulePath = '/v1/task'
const nasShareModulePath = '/v1/share'
const nasFavoriteModulePath = '/v1/favorites'
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
nasServer.defaults.baseURL = host!

export default {
  getServerUrl () {
    return tempServerUrl
  },
  storages () {
    return Vue.axios.get(tempServerUrl + nasFileModulePath + '/storages?' + jsonToParams(null))
  },
  list (path: string, uuid: string) {
    return Vue.axios.get(tempServerUrl + nasFileModulePath + '/list?' + jsonToParams({
      path: path,
      uuid: uuid,
      page: 1,
      size: 1000,
    }))
  },
  ulist (options) {
    return Vue.axios.get(tempServerUrl + nasFileModulePath + '/ulist?' + jsonToParams(options))
  },
  upload (options) {
    return Vue.axios.post(tempServerUrl + nasFileModulePath + '/upload?' + jsonToParams(options.data), options.body, {
      headers: {'Accept': '*/*'}
    })
  },
  addFile (body) {
    return Vue.axios.post(tempServerUrl + nasFileModulePath + '/add?' + jsonToParams(null), body)
  },
  deleteFile (body) {
    return Vue.axios.post(tempServerUrl + nasTaskModulePath + '/add?' + jsonToParams(null), body)
  },
  userList () {
    return Vue.axios.post(tempServerUrl + nasShareModulePath + '/get_all_users?' + jsonToParams(null))
  },
  shareList (body) {
    return Vue.axios.post(tempServerUrl + nasShareModulePath + '/get_shared_files_of_users?' + jsonToParams(null), body)
  },
  shareFile (body) {
    return Vue.axios.post(tempServerUrl + nasShareModulePath + '/share_files?' + jsonToParams(null), body)
  },
  cancleShareFile (body) {
    return Vue.axios.post(tempServerUrl + nasShareModulePath + '/cancel_shared_files1?' + jsonToParams(null), body)
  },
  favouriteList () {
    return Vue.axios.post(tempServerUrl + nasFavoriteModulePath + '/get?' + jsonToParams(null))
  },
  favouriteFile (body) {
    return Vue.axios.post(tempServerUrl + nasFavoriteModulePath + '/set?' + jsonToParams(null), body)
  },
  cancelFavouriteFile (body) {
    return Vue.axios.post(tempServerUrl + nasFavoriteModulePath + '/cancel?' + jsonToParams(null), body)
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
  renameResource (oldPath: string, newPath: string, uuid: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasFileModulePath + '/rename?api_token=' + apiToken, {
      uuid: uuid,
      old_path: oldPath,
      new_path: newPath
    })
  },
  fetchMediaInfo (path: string, uuid: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/media', {
      params: {
        path: path,
        uuid: uuid,
        api_token: apiToken
      }
    })
  },
  fetchUlist (page: number, size: number = 20, order: UploadTimeSort = UploadTimeSort.descend): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/ulist', {
      params: {
        page,
        size,
        order,
        api_token: apiToken
      }
    })
  },
  searchFile (uuid: string, path: string, keyword: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/search', {
      params: {
        uuid,
        path,
        key: keyword,
        api_token: apiToken
      }
    })
  },
  fetchCollectList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasFavoriteModulePath + '/get', null, {
      params: {
        api_token: apiToken
      }
    })
  },
  addCollect (items: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = items.map((item, index) => {
      return {
        uuid: item.uuid,
        path: item.path
      }
    })
    return nasServer.post(nasFavoriteModulePath + '/set', null, {
      params: {
        api_token: apiToken
      },
      data: { files }
    })
  },
  cancelCollect (items: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = items.map((item) => {
      return {
        uuid: item.uuid,
        path: item.path,
        id: item.id
      }
    })
    return nasServer.post(nasFavoriteModulePath + '/cancel', null, {
      params: {
        api_token: apiToken
      },
      data: { files }
    })
  }
}
