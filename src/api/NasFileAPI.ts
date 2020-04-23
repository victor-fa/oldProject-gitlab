import { ResourceItem, UploadParams } from '@/api/NasFileModel';
import { BasicResponse } from '@/api/UserModel';
import Vue from 'vue'
import { jsonToParams, jsonToParamsForPdf } from '../utils/request'
import axios, { AxiosResponse, Canceler } from 'axios/index';
import { NAS_ACCESS, NAS_INFO, CRYPTO_INFO } from '@/common/constants'
import { nasServer } from '@/utils/request';
import { NasInfo, CryptoInfo } from './ClientModel';
import { OrderType, UploadTimeSort } from './NasFileModel';

axios.defaults.withCredentials = true;

const nasFileModulePath = '/v1/file'
const nasTaskModulePath = '/v1/task'
const nasShareModulePath = '/v1/share'
const nasFavoriteModulePath = '/v1/favorites'
const nasMyselfModulePath = '/v1/myself'
const nasUserModulePath = '/v1/user'
const nasCryptoModulePath = '/v1/crypto'

const CancelToken = axios.CancelToken
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
    return host
  },
  storages () {
    return Vue.axios.get(host + nasFileModulePath + '/storages?' + jsonToParams(null))
  },
  list (path: string, uuid: string) {
    return Vue.axios.get(host + nasFileModulePath + '/list?' + jsonToParams({
      path: path,
      uuid: uuid,
      page: 1,
      size: 1000,
    }))
  },
  ulist (options) {
    return Vue.axios.get(host + nasFileModulePath + '/ulist?' + jsonToParams(options))
  },
  upload (options) {
    return Vue.axios.post(host + nasFileModulePath + '/upload?' + jsonToParams(options.data), options.body, {
      headers: {'Accept': '*/*'}
    })
  },
  uploadBackup (options) {
    return Vue.axios.post(host + nasFileModulePath + '/backup/upload?' + jsonToParams(options.data), options.body, {
      headers: {'Accept': '*/*'}
    })
  },
  addFile (body) {
    return Vue.axios.post(host + nasFileModulePath + '/add?' + jsonToParams(null), body)
  },
  deleteFile (body) {
    return Vue.axios.post(host + nasTaskModulePath + '/add?' + jsonToParams(null), body)
  },
  userList () {
    return Vue.axios.post(host + nasShareModulePath + '/get_all_users?' + jsonToParams(null))
  },
  shareList (body) {
    return Vue.axios.post(host + nasShareModulePath + '/get_shared_files_of_users?' + jsonToParams(null), body)
  },
  shareFile (body) {
    return Vue.axios.post(host + nasShareModulePath + '/share_files?' + jsonToParams(null), body)
  },
  cancleShareFile (body) {
    return Vue.axios.post(host + nasShareModulePath + '/cancel_shared_files1?' + jsonToParams(null), body)
  },
  favouriteList () {
    return Vue.axios.post(host + nasFavoriteModulePath + '/get?' + jsonToParams(null))
  },
  favouriteFile (body) {
    return Vue.axios.post(host + nasFavoriteModulePath + '/set?' + jsonToParams(null), body)
  },
  cancelFavouriteFile (body) {
    return Vue.axios.post(host + nasFavoriteModulePath + '/cancel?' + jsonToParams(null), body)
  },
  myselfList () {
    return Vue.axios.post(host + nasMyselfModulePath + '/get_myself_folders?' + jsonToParams(null))
  },
  addMyselfFile (body) {
    return Vue.axios.post(host + nasMyselfModulePath + '/create_myself_folder?' + jsonToParams(null), body)
  },
  modifyMyselfFile (body) {
    return Vue.axios.post(host + nasMyselfModulePath + '/update_myself_folder?' + jsonToParams(null), body)
  },
  deleteMyselfFile (body) {
    return Vue.axios.post(host + nasMyselfModulePath + '/del_myself_folder?' + jsonToParams(null), body)
  },
  download (option) {
    const input = { uuid: option.uuid, path: option.path }
    return host + nasFileModulePath + '/download?' + jsonToParams(input)
  },
  httpDownload (option) { // 针对pdf处理
    const input = { uuid: option.uuid, path: option.path }
    return host + nasFileModulePath + '/http_download?' + jsonToParamsForPdf(input)
  },
  fetchStorages (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/storages')
  },
  fetchResourceList (path: string, uuid: string, page: number, size: number, order: OrderType = OrderType.byNameDesc): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/list', {
      params: {
        path: path,
        uuid: uuid,
        page: page,
        size: size,
        order: order
      }
    })
  },
  renameResource (oldPath: string, newPath: string, uuid: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasFileModulePath + '/rename', {
      uuid: uuid,
      old_path: oldPath,
      new_path: newPath
    })
  },
  fetchMediaInfo (path: string, uuid: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/media', {
      params: {
        path: path,
        uuid: uuid
      }
    })
  },
  fetchUlist (page: number, order: UploadTimeSort = UploadTimeSort.descend, size: number = 20): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/ulist', {
      params: {
        page,
        size,
        order
      }
    })
  },
  fetchBackuplist (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/backup/list', {
      params: {
      }
    })
  },
  searchFile (uuid: string, path: string, keyword: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasFileModulePath + '/search', {
      params: {
        uuid,
        path,
        key: keyword
      }
    })
  },
  fetchCollectList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasFavoriteModulePath + '/get')
  },
  collectFile (items: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = items.map((item, index) => {
      return {
        uuid: item.uuid,
        path: item.path
      }
    })
    return nasServer.post(nasFavoriteModulePath + '/set', { files })
  },
  cancelCollect (items: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = items.map((item) => {
      return {
        uuid: item.uuid,
        path: item.path,
        id: item.id
      }
    })
    return nasServer.post(nasFavoriteModulePath + '/cancel', { files })
  },
  fetchShareUserList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasShareModulePath + '/get_all_users')
  },
  fetchShareFileList (ugreenNo: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasShareModulePath + '/get_shared_files_of_users', {
      nas_users: [ { ugreen_no: Number(ugreenNo) } ]
    })
  },
  shareResource (items: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = items.map(item => {
      return {
        path: item.path,
        uuid: item.uuid
      }
    })
    return nasServer.post(nasShareModulePath + '/share_files', { files })
  },
  cancelShare (items: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = items.map(item => {
      return {
        path: item.path,
        uuid: item.uuid
      }
    })
    return nasServer.post(nasShareModulePath + '/cancel_shared_files1', { files })
  },
  addCopyTask(srcItems: Array<ResourceItem>, dstItem: ResourceItem, mode: TaskMode): Promise<AxiosResponse<BasicResponse>> {
    const src = srcItems.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    const dst = { path: dstItem.path, uuid: dstItem.uuid }
    return nasServer.post(nasTaskModulePath + '/add', {
      type: 1,
      data: { mode, src, dst }
    })
  },
  addMoveTask(srcItems: Array<ResourceItem>, dstItem: ResourceItem, mode: TaskMode): Promise<AxiosResponse<BasicResponse>> {
    const src = srcItems.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    const dst = { path: dstItem.path, uuid: dstItem.uuid }
    return nasServer.post(nasTaskModulePath + '/add', {
      type: 2,
      data: { mode, src, dst }
    })
  },
  addDeleteTask(srcItems: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = srcItems.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    return nasServer.post(nasTaskModulePath + '/add', {
      type: 4,
      data: { mode: 1, files }
    })
  },
  fetchRemoteTaskList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasTaskModulePath + '/list')
  },
  pauseRemoteTask (id: number): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasTaskModulePath + '/pause', {
      params: { task_id: id }
    })
  },
  continueRemoteTask (id: number): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasTaskModulePath + '/continue', {
      params: { task_id: id }
    })
  },
  removeRemoteTask (id: number): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(nasTaskModulePath + '/remove', {
      params: { task_id: id }
    })
  },
  uploadData (params: UploadParams, data: Buffer, cancel?: Canceler): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasFileModulePath + '/upload', data, { 
      params,
      cancelToken: new CancelToken(function executor(c) {
        cancel = c
      })
    })
  },
  newFolder (path: string, uuid: string, newName: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasFileModulePath + '/add', {
      uuid,
      path,
      type: 2,
      alias: newName
    })
  },
  newCustomFolder (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasMyselfModulePath + '/create_myself_folder', {
      uuid: ''
    })
  },
  setOfflineAccount (data): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasUserModulePath + '/offline/account/set', {
      offline_username: data.offline_username,
      offline_password: data.offline_password
    })
  },
  modifyOfflineAccount (data): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasUserModulePath + '/offline/account/update', {
      offline_password: data.offline_password,
      offline_password_new: data.offline_password_new
    })
  },
  deleteOfflineAccount (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasUserModulePath + '/offline/account/delete')
  },
  getOfflineName (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasUserModulePath + '/getOfflineName')
  },
  getEncryptStatus (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasUserModulePath + '/security/statusquery')
  },
  setEncrypt (security_user_password): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasUserModulePath + '/security/enable', {
      security_user_password
    })
  },
  loginEncrypt (security_password): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasUserModulePath + '/security/login', {
      security_password
    })
  },
  getEncryptList (): Promise<AxiosResponse<BasicResponse>> {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    return nasServer.get(nasCryptoModulePath + '/list', {
      params: {
        crypto_token: token.crypto_token
      }
    })
  },
  modifyEncrypt (data): Promise<AxiosResponse<BasicResponse>> {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    return nasServer.post(nasUserModulePath + '/security/password', {
      security_user_password: data.security_user_password,
      security_user_password_new: data.security_user_password_new
    }, {
      params: {
        crypto_token: token.crypto_token
      }
    })
  },
  resetEncrypt (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(nasUserModulePath + '/security/reset')
  },
}

enum TaskMode {
  skip = 1,
  rename = 2,
  cover = 3
}

export {
  TaskMode
}
