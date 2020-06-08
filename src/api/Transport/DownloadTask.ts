// 下载任务类，支持断点下载
import _ from 'lodash'
import NasFileAPI from '../NasFileAPI'
import FileHandle, { FileHandleError } from '@/utils/FileHandle'
import axios, { AxiosResponse, CancelTokenSource } from 'axios'
import { DownloadParams, ResourceItem, ResourceType } from '../NasFileModel'
import BaseTask, { TaskStatus, TaskError, TaskErrorCode, FileInfo } from './BaseTask'
import path from 'path'
import StringUtility from '@/utils/StringUtility'

export default class DownloadTask extends BaseTask {
  readonly maxDownloadSize = 1 * 1024 * 1024 // 单次最大下载字节数
  source?: CancelTokenSource // 下载取消请求标识
  private fileHandle = -1 // 文件句柄
  private resourceItem?: ResourceItem
  private fileCount = 0

  constructor(item: ResourceItem | string, destPath: string, uuid: string) {
    super(item, destPath, uuid)
    const CancelToken = axios.CancelToken
    this.source = CancelToken.source()
    if (_.isObject(item)) {
      this.resourceItem = item
    }
  }
  // public methods
  async start () {
    super.start()
    // 1. 转换需要下载的文件对象
    if (this.resourceItem !== undefined) {
      await this.fetchFileInfos(this.resourceItem)
    }
    console.log(this.fileInfos)
    // 2. 计算总文件大小
    this.calculateDownloadSize()
    // 3. 开始递归下载
    this.downloadFile()
  }
  cancel () {
    super.cancel()
    this.fileHandle !== -1 && FileHandle.closeFileHandle(this.fileHandle)
    this.source !== undefined && this.source.cancel()
    this.removeUnfinishedFile()
  }
  suspend () {
    super.suspend()
    this.fileHandle !== -1 && FileHandle.closeFileHandle(this.fileHandle)
    this.fileHandle = -1
    this.source !== undefined && this.source.cancel()
    this.source = undefined
  }
  resume () {
    super.resume()
    const CancelToken = axios.CancelToken
    this.source = CancelToken.source()
    this.downloadFile()
  }
  // private methods
  // 获取待下载的文件
  private fetchFileInfos (item: ResourceItem): Promise<void> {
    return new Promise((resolve, reject) => {
      if (item.type !== ResourceType.folder) {
        const fileInfo = this.convertFileInfo(item)
        this.fileInfos = [fileInfo]
        resolve()
      } else {
        this.recursionFetchTree(1, error => {
          if (error !== undefined) {
            this.status = TaskStatus.error
            this.emit('error', this.index, error)
          }
          resolve()
        })
      }
    })
  } 
  // 删除未完成文件
  private removeUnfinishedFile () {
    this.fileInfos.forEach(item => {
      if (item.completedSize < item.totalSize && item.completedSize > 0) { // not completed
        FileHandle.removeFile(item.destPath)
      }
    })
  }
  // 递归获取文件树
  recursionFetchTree (page: number, completionHandler: (error?: TaskError) => void) {
    NasFileAPI.fetchFileTree(this.srcPath, this.uuid, page).then(response => {
      if (response.data.code !== 200) {
        const error = new TaskError(TaskErrorCode.serverError, response.data.msg)
        completionHandler(error)
      } else {
        this.fileCount = _.get(response.data.data, 'total')
        const list = _.get(response.data.data, 'list') as ResourceItem[]
        const fileInfos = list.map(item => {
          return this.convertFileInfo(item)
        })
        this.fileInfos = page === 1 ? fileInfos : this.fileInfos.concat(fileInfos)
        if (_.isEmpty(list) || this.fileInfos.length >= this.fileCount) {
          completionHandler()
        } else {
          this.recursionFetchTree(page + 1, completionHandler)
        }
      }
    }).catch(_ => {
      const error = new TaskError(TaskErrorCode.networkError)
      completionHandler(error)
    })
  }
  // 将资源对象转换成文件对象
  private convertFileInfo (item: ResourceItem) {
    const name = StringUtility.formatName(item.path)
    let destPath = `${this.destPath}/${name}`
    let relativePath: string | undefined
    if (this.resourceItem!.type === ResourceType.folder) {
      const directory = path.dirname(this.resourceItem!.path)
      relativePath = item.path.substring(directory.length, item.path.length)
      destPath = `${this.destPath}${relativePath}`
    }
    const fileInfo: FileInfo = {
      name,
      relativePath,
      destPath,
      srcPath: item.path,
      totalSize: item.size,
      completedSize: 0,
      isDirectory: item.type === ResourceType.folder
    }
    return fileInfo
  }
  // 计算下载任务总大小
  private calculateDownloadSize () {
    this.countOfBytes = 0
    this.completedBytes = 0
    this.fileInfos.forEach(item => {
      this.countOfBytes += item.totalSize
      this.completedBytes += item.completedSize
    })
  }
  // 递归下载文件
  private downloadFile () {
    if (this.status !== TaskStatus.progress) return
    const fileInfo = this.getNextFileInfo()
    if (fileInfo === null) {
      this.status = TaskStatus.finished
      this.emit('taskFinished', this.index)
      return
    }
    if (fileInfo.isDirectory === true) {
      this.createDirectory(fileInfo)
    } else {
      this.startDownloadFile(fileInfo)
    }
  }
  // 创建目录
  private createDirectory (fileInfo: FileInfo) {
    FileHandle.newDirectory(fileInfo.destPath).then(() => {
      fileInfo.newCompleted = true
      this.emit('fileFinished', this.index, _.cloneDeep(fileInfo))
      this.downloadFile()
    }).catch(_ => {
      fileInfo.newCompleted = true
      this.downloadFile()
    })
  }
  // 开始文件下载
  private startDownloadFile (fileInfo: FileInfo) {
    FileHandle.openWriteFileHandle(fileInfo.destPath).then(obj => { // open file handle
      this.fileHandle = obj.fd
      fileInfo.destPath = obj.path 
      return this.downloadSingleFile(obj.fd, fileInfo)
    }).then(fd => { // download file
      return FileHandle.closeFileHandle(fd)
    }).then(() => { // close file handle
      this.fileHandle = -1
      return FileHandle.renameFinishedFile(fileInfo.destPath)
    }).then(path => { // rename file
      fileInfo.destPath = path
      this.downloadFile()
      this.emit('fileFinished', this.index, _.cloneDeep(fileInfo))
      console.log(fileInfo)
    }).catch(error => {
      if (error instanceof TaskError) {
        this.handleDownloadError(error.code)
      } else if (error === FileHandleError.openError) {
        this.handleDownloadError(TaskErrorCode.openHandleError)
      } else {
        this.handleDownloadError(TaskErrorCode.closeHandleError)
      }
    })
  }
  // 获取待上传文件对象
  private getNextFileInfo () {
    for (let index = 0; index < this.fileInfos!.length; index++) {
      const item = this.fileInfos[index]
      if (item.isDirectory === true) {
        if (item.newCompleted !== true) return item
      } else {
        if (item.completedSize < item.totalSize) return item
      }
    }
    return null
  }
  // 递归下载单个文件
  private downloadSingleFile (fd: number, fileInfo: FileInfo): Promise<number> {
    return new Promise((resolve, reject) => {
      this.downloadFileChunk(fd, fileInfo, (error?: TaskError) => {
        if (!_.isEmpty(error)) {
          reject(error)
        } else {
          this.emit('progress', this.index)
          if (this.countOfBytes === 0) this.countOfBytes = fileInfo.totalSize
          fileInfo.completedSize >= fileInfo.totalSize && resolve(fd)
        }
      })
    })
  }
  // 下载并写入文件数据
  protected downloadFileChunk (fd: number, fileInfo: FileInfo, completionHandler: (error?: TaskError) => void) {
    this.downloadChunkData(fileInfo).then(response => { // download data
      if (response.status !== 200 && response.status !== 206) {
        const error = new TaskError(TaskErrorCode.serverError, response.statusText)
        return Promise.reject(error)
      }
      const result = this.parseResponse(response)
      if (result === null) {
        const error = new TaskError(TaskErrorCode.serverError, 'response headers is null')
        return Promise.reject(error)
      }
      fileInfo.totalSize = result.total
      fileInfo.completedSize += result.bytes
      return FileHandle.wirteFile(fd, result.buffer)
    }).then(() => { // write data
      if (this.status !== TaskStatus.progress) return
      completionHandler()
      if (fileInfo.completedSize < fileInfo.totalSize) this.downloadFileChunk(fd, fileInfo, completionHandler)
    }).catch(error => { // catch error
      if (this.status !== TaskStatus.progress || axios.isCancel(error)) return
      if (error === FileHandleError.writeError) {
        const error = new TaskError(TaskErrorCode.writeDataError)
        completionHandler(error)
      } else {
        const error = new TaskError(TaskErrorCode.networkError)
        completionHandler(error)
      }
    })
  }
  // 生成下载请求参数
  generateDownloadParams (fileInfo: FileInfo): DownloadParams {
    return {
      uuid: this.uuid,
      path: fileInfo.srcPath,
      start: fileInfo.completedSize,
      end: fileInfo.completedSize + this.maxDownloadSize
    }
  }
  // 解析响应头
  private parseResponse (response: AxiosResponse<ArrayBuffer>) {
    // parse header
    const length = _.get(response.headers, 'content-length') as string
    const range = _.get(response.headers, 'content-range') as string
    if (_.isEmpty(length) || _.isEmpty(range)) return null
    const index = range.lastIndexOf('/') + 1
    const total = range.substring(index, range.length)
    // parse response
    const buffer = Buffer.from(response.data)
    return {
      bytes: Number(length),
      total: Number(total),
      buffer
    }
  }
  // 处理下载错误回调
  private handleDownloadError (code: TaskErrorCode, desc?: string) {
    const error = new TaskError(code, desc)
    this.status = TaskStatus.error
    this.emit('error', this.index, error)
  }
  // protected methods
  downloadChunkData (fileInfo: FileInfo, source?: CancelTokenSource) {
    const params = this.generateDownloadParams(fileInfo)
    return NasFileAPI.downloadData(params, this.source)
  }
}
