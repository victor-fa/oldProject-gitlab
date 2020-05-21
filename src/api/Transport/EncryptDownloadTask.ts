// 下载任务类，支持断点下载
import _ from 'lodash'
import NasFileAPI from '../NasFileAPI'
import FileHandle, { FileHandleError } from '@/utils/FileHandle'
import axios, { AxiosResponse, CancelTokenSource } from 'axios'
import { DownloadParams } from '../NasFileModel'
import DownloadTask, { TaskStatus, TaskError, TaskErrorCode, FileInfo } from './BaseTask'
import StringUtility from '@/utils/StringUtility'

/** 目前只支持下载文件，不支持文件夹下载
 * progress (index) 上传进度回调
 * fileFinished (index, fileInfo) 单个文件下载完成
 * taskFinished (index) 下载任务完成
 * error (index, error) 任务出错回调
 */
export default class EncryptDownloadTask extends DownloadTask {
  readonly maxDownloadSize = 1 * 1024 * 1024 // 单次最大下载字节数
  source?: CancelTokenSource // 下载取消请求标识
  downloadFileChunk (fd: number, fileInfo: FileInfo, completionHandler: (error?: TaskError) => void) {
    const params = this.generateDownloadParams(fileInfo)
    NasFileAPI.encryptDownloadData(params, this.source).then(response => { // download data
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
  parseResponse (response: AxiosResponse<ArrayBuffer>) {
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
}
