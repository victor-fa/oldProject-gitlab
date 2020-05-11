// 下载任务类，支持断点下载
import _ from 'lodash'
import NasFileAPI from '../NasFileAPI'
import FileHandle, { FileHandleError } from '@/utils/FileHandle'
import axios, { AxiosResponse, CancelTokenSource } from 'axios'
import { DownloadParams } from '../NasFileModel'
import BaseTask, { TaskStatus, TaskError, TaskErrorCode } from './BaseTask'

/** 目前只支持下载文件，不支持文件夹下载
 * progress (index) 上传进度回调
 * finished (index) 上传任务完成回调
 * error (index, error) 任务出错回调
 */
export default class DownloadTask extends BaseTask {
  readonly maxDownloadSize = 1 * 1024 * 1024 // 单次最大下载字节数
  source?: CancelTokenSource // 下载取消请求标识
  private fileHandle = -1 // 文件句柄

  constructor(srcPath: string, destPath: string, uuid: string) {
    super(srcPath, destPath, uuid)
    const CancelToken = axios.CancelToken
    this.source = CancelToken.source()
  }
  // public methods
  async start () {
    super.start()
    this.downloadFile(this.srcPath, this.uuid)
  }
  cancel () {
    super.cancel()
    this.fileHandle !== -1 && FileHandle.closeFileHandle(this.fileHandle)
    this.source !== undefined && this.source.cancel()
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
    this.downloadFile(this.srcPath, this.uuid)
    const CancelToken = axios.CancelToken
    this.source = CancelToken.source()
  }
  // private methods
  // 下载文件
  private downloadFile (path: string, uuid: string) {
    const destPath = this.spliceDestPath(path, this.destPath)
    FileHandle.openWriteFileHandle(destPath).then(fd => { // open file handle
      this.fileHandle = fd
      return this.downloadSingleFile(fd, path, uuid)
    }).then(fd => { // download file
      return FileHandle.closeFileHandle(fd)
    }).then(() => { // close file handle
      this.fileHandle = -1
      this.emit('finished', this.index)
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
  // 递归下载单个文件
  private downloadSingleFile (fd: number, path: string, uuid: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.downloadFileChunk(fd, (error?: TaskError) => {
        if (!_.isEmpty(error)) {
          reject(error)
        } else {
          this.emit('progress', this.index)
          this.completedBytes >= this.countOfBytes && resolve(fd)
        }
      })
    })
  }
  // 下载并写人文件数据
  private downloadFileChunk (fd: number, completionHandler: (error?: TaskError) => void) {
    const params = this.generateDownloadParams()
    NasFileAPI.downloadData(params, this.source).then(response => { // download data
      if (response.status !== 200 && response.status !== 206) {
        const error = new TaskError(TaskErrorCode.serverError, response.statusText)
        return Promise.reject(error)
      }
      const result = this.parseResponse(response)
      if (result === null) {
        const error = new TaskError(TaskErrorCode.serverError, 'response headers is null')
        return Promise.reject(error)
      }
      this.countOfBytes = result.total
      this.completedBytes += result.bytes
      return FileHandle.wirteFile(fd, result.buffer)
    }).then(() => { // write data
      if (this.status !== TaskStatus.progress) return
      completionHandler()
      console.log(`${this.completedBytes}/${this.countOfBytes}`)
      if (this.completedBytes < this.countOfBytes) this.downloadFileChunk(fd, completionHandler)
    }).catch(error => { // catch error
      console.log(error)
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
  generateDownloadParams (): DownloadParams {
    return {
      uuid: this.uuid,
      path: this.srcPath,
      start: this.completedBytes,
      end: this.completedBytes + this.maxDownloadSize
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
  // 拼接目标文件路径
  private spliceDestPath (srcPath: string, destDir: string) {
    const index = srcPath.lastIndexOf('/') + 1
    const filename = srcPath.substring(index, srcPath.length)
    return `${destDir}/${filename}`
  }
  // 处理下载错误回调
  private handleDownloadError (code: TaskErrorCode) {
    const error = new TaskError(code)
    this.status = TaskStatus.error
    this.emit('error', this.index, error)
  }
}
