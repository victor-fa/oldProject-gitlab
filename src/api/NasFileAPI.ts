import _ from 'lodash'
import { ResourceItem, UploadParams, CustomInfo, DownloadParams, ResourceType } from '@/api/NasFileModel';
import { BasicResponse } from '@/api/UserModel';
import Vue from 'vue'
import { jsonToParams, jsonToParamsForPdf, source } from '../utils/request'
import { CRYPTO_INFO } from '@/common/constants'
import { NasInfo, CryptoInfo } from './ClientModel';
import axios, { AxiosResponse, Canceler, CancelTokenSource } from 'axios/index'
import { OrderType, UploadTimeSort } from './NasFileModel'
import { nasServer } from './NasServer';
import store from '@/store';

axios.defaults.withCredentials = true;

const fileModule = '/v1/file'
const taskModule = '/v1/task'
const shareModule = '/v1/share'
const collectModule = '/v1/favorites'
const myselfModule = '/v1/myself'
const userModule = '/v1/user'
const cryptoModule = '/v1/crypto'
const recycleModule = '/v1/recycle'
const settingModule = '/setting/v1/sys'

const CancelToken = axios.CancelToken
let cancelCustomRequest: Canceler | null = null
const host = (() => {
    const nasInfo = _.get(store.getters, 'NasServer/nasInfo') as NasInfo
    return `http://${nasInfo.ip}:${nasInfo.port}`
})()
nasServer.defaults.baseURL = host

export default {
  getServerUrl () {
    return host
  },
  download (option) {
    const input = { uuid: option.uuid, path: option.path }
    return host + fileModule + '/download?' + jsonToParams(input)
  },
  httpDownload (option) { // 针对pdf处理
    const input = { uuid: option.uuid, path: option.path }
    return host + fileModule + '/http_download?' + jsonToParamsForPdf(input)
  },
  encryptDownload (option) {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    const input = { uuid: option.uuid, path: option.path, crypto_token: token.crypto_token }
    return host + cryptoModule + '/download?' + jsonToParams(input)
  },
  httpEncryptDownload (option) {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    const input = { uuid: option.uuid, path: option.path, crypto_token: token.crypto_token }
    return host + cryptoModule + '/http_download?' + jsonToParams(input)
  },
  fetchStorages (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(fileModule + '/storages')
  },
  fetchResourceList (path: string, uuid: string, page: number, order: OrderType = OrderType.byNameDesc, size: number = 40): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(fileModule + '/list', {
      params: {
        path: path,
        uuid: uuid,
        page: page,
        size: size,
        order: order
      }
    })
  },
  renameResource (oldPath: string, newPath: string, uuid: string, route: string): Promise<AxiosResponse<BasicResponse>> {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    let params
    if (route === 'encrypt') {
      params = { crypto_token: token.crypto_token }
    }
    return nasServer.post(fileModule + '/rename', {
      uuid: uuid,
      old_path: oldPath,
      new_path: newPath
    }, { params })
  },
  fetchMediaInfo (path: string, uuid: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(fileModule + '/media', {
      params: {
        path: path,
        uuid: uuid
      }
    })
  },
  fetchTlist (page: number, last: number, type: ResourceType, order: OrderType = OrderType.ByModifyAsc, size: number = 40): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(fileModule + '/tlist', {
      params: { type, page, size, pos: last, order }
    })
  },
  fetchUlist (page: number, last: number, order: UploadTimeSort = UploadTimeSort.descend, size: number = 40): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(fileModule + '/ulist', {
      params: { page, size, order, pos: last }
    })
  },
  fetchBackuplist (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(fileModule + '/backup/list', {
      params: {
      }
    })
  },
  searchFile (uuid: string, path: string, keyword: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(fileModule + '/search', {
      params: {
        uuid,
        path,
        key: keyword
      }
    })
  },
  fetchCollectList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(collectModule + '/get')
  },
  collectFile (items: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = items.map((item, index) => {
      return {
        uuid: item.uuid,
        path: item.path
      }
    })
    return nasServer.post(collectModule + '/set', { files })
  },
  cancelCollect (items: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = items.map((item) => {
      return {
        uuid: item.uuid,
        path: item.path,
        id: item.id
      }
    })
    return nasServer.post(collectModule + '/cancel', { files })
  },
  fetchShareUserList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(shareModule + '/get_all_users')
  },
  fetchShareFileList (ugreenNo: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(shareModule + '/get_shared_files_of_users', {
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
    return nasServer.post(shareModule + '/share_files', { files })
  },
  cancelShare (items: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = items.map(item => {
      return {
        path: item.path,
        uuid: item.uuid
      }
    })
    return nasServer.post(shareModule + '/cancel_shared_files1', { files })
  },
  addCopyTask(srcItems: Array<ResourceItem>, dstItem: ResourceItem, mode: TaskMode): Promise<AxiosResponse<BasicResponse>> {
    const src = srcItems.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    const dst = { path: dstItem.path, uuid: dstItem.uuid }
    return nasServer.post(taskModule + '/add', {
      type: 1,
      data: { mode, src, dst }
    })
  },
  addMoveTask(srcItems: Array<ResourceItem>, dstItem: ResourceItem, mode: TaskMode): Promise<AxiosResponse<BasicResponse>> {
    const src = srcItems.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    const dst = { path: dstItem.path, uuid: dstItem.uuid }
    return nasServer.post(taskModule + '/add', {
      type: 2,
      data: { mode, src, dst }
    })
  },
  addDeleteTask(srcItems: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const files = srcItems.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    return nasServer.post(taskModule + '/add', {
      type: 4,
      data: { mode: 1, files }
    })
  },
  addEncryptRemoveTask(srcItems: Array<ResourceItem>): Promise<AxiosResponse<BasicResponse>> {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    const files = srcItems.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    return nasServer.post(taskModule + '/add', {
      type: 5,
      data: { mode: 1, files }
    }, {
      params: {
        crypto_token: token.crypto_token
      }
    })
  },
  addEncryptMoveIntoTask(srcItems: Array<ResourceItem>, dstPath: string, mode: TaskMode, crypto_token: string): Promise<AxiosResponse<BasicResponse>> {
    const src = srcItems.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    const dst = { path: dstPath }
    return nasServer.post(taskModule + '/add', {
      type: 6,
      data: { mode, src, dst }
    }, {
      params: {
        crypto_token: crypto_token
      }
    })
  },
  addEncryptMoveOutTask(srcItems: Array<ResourceItem>, dstItem: ResourceItem, mode: TaskMode): Promise<AxiosResponse<BasicResponse>> {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    const src = srcItems.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    const dst = { path: dstItem.path, uuid: dstItem.uuid }
    return nasServer.post(taskModule + '/add', {
      type: 7,
      data: { mode, src, dst }
    }, {
      params: {
        crypto_token: token.crypto_token
      }
    })
  },
  fetchRemoteTaskList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(taskModule + '/list')
  },
  pauseRemoteTask (id: number): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(taskModule + '/pause', {
      params: { task_id: id }
    })
  },
  continueRemoteTask (id: number): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(taskModule + '/continue', {
      params: { task_id: id }
    })
  },
  removeRemoteTask (id: number): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.get(taskModule + '/remove', {
      params: { task_id: id }
    })
  },
  uploadData (params: UploadParams, data: Buffer, source?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(fileModule + '/upload', data, { 
      params,
      headers: { 'Content-Type': ' application/octet-stream' },
      cancelToken: source === undefined ? undefined : source.token
    })
  },
  uploadBackup (params: UploadParams, data: Buffer, source?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(fileModule + '/backup/upload', data, { 
      params,
      headers: { 'Content-Type': ' application/octet-stream' },
      cancelToken: source === undefined ? undefined : source.token
    })
  },
  uploadEncrypt (params: UploadParams, data: Buffer, source?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(cryptoModule + '/upload', data, { 
      params,
      headers: { 'Content-Type': ' application/octet-stream' },
      cancelToken: source === undefined ? undefined : source.token
    })
  },
  downloadData (params: DownloadParams, source?: CancelTokenSource): Promise<AxiosResponse<ArrayBuffer>> {
    return nasServer.get(fileModule + '/download', {
      params: { path: params.path, uuid: params.uuid },
      headers: { 'Range': `bytes=${params.start}-${params.end}` },
      responseType: 'arraybuffer',
      cancelToken: source === undefined ? undefined : source.token
    })
  },
  encryptDownloadData (params: DownloadParams, source?: CancelTokenSource): Promise<AxiosResponse<ArrayBuffer>> {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    return nasServer.get(cryptoModule + '/download', {
      params: { path: params.path, uuid: params.uuid, crypto_token: token.crypto_token },
      headers: { 'Range': `bytes=${params.start}-${params.end}` },
      responseType: 'arraybuffer',
      cancelToken: source === undefined ? undefined : source.token
    })
  },
  newFolder (path: string, uuid: string, newName: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(fileModule + '/add', {
      uuid,
      path,
      type: 2,
      alias: newName
    })
  },
  setOfflineAccount (data): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModule + '/offline/account/set', {
      offline_username: data.offline_username,
      offline_password: data.offline_password
    })
  },
  modifyOfflineAccount (data): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModule + '/offline/account/update', {
      offline_password: data.offline_password,
      offline_password_new: data.offline_password_new
    })
  },
  deleteOfflineAccount (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModule + '/offline/account/delete')
  },
  getOfflineName (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModule + '/getOfflineName')
  },
  getEncryptStatus (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModule + '/security/statusquery')
  },
  setEncrypt (security_user_password): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModule + '/security/enable', {
      security_user_password
    })
  },
  loginEncrypt (security_password): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModule + '/security/login', {
      security_password
    })
  },
  getEncryptList (path?): Promise<AxiosResponse<BasicResponse>> {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    return nasServer.get(cryptoModule + '/list', {
      params: {
        path,
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
    return nasServer.post(userModule + '/security/password', {
      security_user_password: data.security_user_password,
      security_user_password_new: data.security_user_password_new
    }, {
      params: {
        crypto_token: token.crypto_token
      }
    })
  },
  resetEncrypt (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(userModule + '/security/reset')
  },
  logoutEncrypt (): Promise<AxiosResponse<BasicResponse>> {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    if (cryptoJson === null) {
      return Promise.reject(Error('not find crypto_info'))
    }
    const token = JSON.parse(cryptoJson) as CryptoInfo
    return nasServer.post(userModule + '/security/logout', {
      security_password: token.security_password
    }, {
      params: {
        crypto_token: token.crypto_token
      }
    })
  },
  backupCheck (path: string, md5: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(fileModule + '/backup/check', {}, {
      params: {
        path,
        md5
      },
      headers: {'Accept': '*/*'}
    })
  },
  newCustomFolder (info: CustomInfo): Promise<AxiosResponse<BasicResponse>> {
    const newInfo = filterParams(info)
    return nasServer.post(myselfModule + '/create_myself_folder', {
      uuid: '',
      myself_folder: newInfo
    }, {
      cancelToken: new CancelToken(function executor(c) {
        cancelCustomRequest = c
      })
    })
  },
  uploadCustomCover (path: string, uuid: string, img: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(myselfModule + '/update_background_img', {
      uuid, path, background_img: img
    }, {
      cancelToken: new CancelToken(function executor(c) {
        cancelCustomRequest = c
      })
    })
  },
  cancelCustomRequest () {
    if (cancelCustomRequest !== null) {
      cancelCustomRequest()
    }
  },
  fetchCustomList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(myselfModule + '/get_myself_folders')
  },
  deleteCustomFolder (path: string, uuid: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(myselfModule + '/del_myself_folder', { path, uuid })
  },
  updateCustomInfo (path: string, uuid: string, info: CustomInfo): Promise<AxiosResponse<BasicResponse>> {
    const newInfo = filterParams(info)
    return nasServer.post(myselfModule + '/update_myself_folder', {
      path, uuid, myself_folder: newInfo
    })
  },
  fetchCustomInfo (path: string, uuid: string): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(myselfModule + '/get_myself_folder', { path, uuid })
  },
  fetchRecycleList (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.post(recycleModule + '/list')
  },
  recoveryFile (items: ResourceItem[]): Promise<AxiosResponse<BasicResponse>> {
    const params = items.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    return nasServer.post(recycleModule + '/recovery', params)
  },
  deleteFile (items: ResourceItem[]): Promise<AxiosResponse<BasicResponse>> {
    const params = items.map(item => {
      return { path: item.path, uuid: item.uuid }
    })
    return nasServer.post(fileModule + '/delete', params)
  },
  shutdown (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.put(settingModule + '/shutdown')
  },
  reboot (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.put(settingModule + '/reboot')
  },
  factory (): Promise<AxiosResponse<BasicResponse>> {
    return nasServer.put(settingModule + '/reboot')
  },
}

const filterParams = (params: object) => {
  let newParams = _.cloneDeep(params)
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const element = params[key]
      if (!_.isNumber(element) && _.isEmpty(element)) delete newParams[key]
    }
  }
  return newParams
}

enum TaskMode {
  skip = 1,
  rename = 2,
  cover = 3
}

export {
  TaskMode
}
