// 下载任务类，支持断点下载
import _ from 'lodash'
import NasFileAPI from '../NasFileAPI'
import FileHandle, { FileHandleError } from '@/utils/FileHandle'
import axios, { AxiosResponse, CancelTokenSource } from 'axios'
import { DownloadParams } from '../NasFileModel'
import BaseTask, { TaskStatus, TaskError, TaskErrorCode, FileInfo } from './BaseTask'
import StringUtility from '@/utils/StringUtility'

export default class DownloadTask extends BaseTask {
  readonly maxDownloadSize = 1 * 1024 * 1024 // 单次最大下载字节数
  source?: CancelTokenSource // 下载取消请求标识
  private fileHandle = -1 // 文件句柄

  constructor(srcPath: string, destPath: string, uuid: string) {
    super(srcPath, destPath, uuid)
    const CancelToken = axios.CancelToken
    this.source = CancelToken.source()
    this.initFileInfo()
  }
  // public methods
  async start () {
    super.start()
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
  /**更新待下载的文件对象集合
   * 下载目录时调用
   */
  updateFileInfos (fileInfos: FileInfo[]) {
    this.fileInfos = fileInfos
  }
  // private methods
  // 初始化待上传文件对象
  private initFileInfo () {
    const fileName = StringUtility.formatName(this.srcPath)
    const fileInfo: FileInfo = {
      srcPath: this.srcPath,
      destPath: `${this.destPath}/${fileName}`,
      name: fileName,
      totalSize: 0,
      completedSize: 0
    }
    this.fileInfos = [fileInfo]
  }
  // 删除未完成文件
  private removeUnfinishedFile () {
    this.fileInfos.forEach(item => {
      if (item.completedSize < item.totalSize && item.completedSize > 0) { // not completed
        FileHandle.removeFile(item.destPath)
      }
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
  getNextFileInfo () {
    for (let index = 0; index < this.fileInfos.length; index++) {
      const item = this.fileInfos[index]
      if (item.completedSize < item.totalSize || item.completedSize === 0) return item
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
  private handleDownloadError (code: TaskErrorCode) {
    const error = new TaskError(code)
    this.status = TaskStatus.error
    this.emit('error', this.index, error)
  }
  // protected methods
  downloadChunkData (fileInfo: FileInfo, source?: CancelTokenSource) {
    const params = this.generateDownloadParams(fileInfo)
    return NasFileAPI.downloadData(params, this.source)
  }
}
