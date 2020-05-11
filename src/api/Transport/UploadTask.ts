// 上传工具类，支持目录和文件上传、断点续传
import _ from 'lodash'
import fs from 'fs'
import BaseTask, { FileInfo, TaskStatus, TaskErrorCode, TaskError } from './BaseTask'
import NasFileAPI from '../NasFileAPI'
import { UploadParams } from '../NasFileModel'
import FileHandle, { FileHandleError } from '../../utils/FileHandle'
import axios, { AxiosResponse, CancelTokenSource } from 'axios'
import { BasicResponse } from '../UserModel'
import StringUtility from '../../utils/StringUtility'

const CancelToken = axios.CancelToken

export default class UploadTask extends BaseTask {
  source? = CancelToken.source() // 下载取消请求标识
  private fileHandle = -1 // 标记当前正在操作的文件句柄

  // public methods
  async start () {
    super.start()
    // 1. 解析当前目录
    _.isEmpty(this.fileInfos) && await this.parseSourcePath(this.srcPath)
    // 2. 过滤掉空目录
    if (_.isEmpty(this.fileInfos)) {
      this.handlerTaskError(TaskErrorCode.pathError)
      return
    }
    // 3. 计算待上传文件的总大小
    this.calculatorUploadFileSize()
    // 4. 开始递归上传文件
    this.uploadFile()
  }
  cancel () {
    super.cancel()
    this.fileInfos = []
    if (this.fileHandle > 0) FileHandle.closeFileHandle(this.fileHandle)
    this.source !== undefined && this.source.cancel()
  }
  suspend () {
    super.suspend()
    if (this.fileHandle > 0) FileHandle.closeFileHandle(this.fileHandle)
    this.fileHandle = -1
    this.source !== undefined && this.source.cancel()
    this.source = undefined
  }
  resume () {
    super.resume()
    const CancelToken = axios.CancelToken
    this.source = CancelToken.source()
    this.uploadFile()
  }
  // pricvate methods 
  // 解析文件源路径
  private async parseSourcePath (path: string) {
    await FileHandle.statFile(path).then(stats => {
      return this.getUploadFileInfos(stats)
    }).then(fileInfos => {
      this.fileInfos = fileInfos
    }).catch(_ => {
      this.handlerTaskError(TaskErrorCode.readStatError)
    })
  }
  // 获取需要上传的文件对象
  private getUploadFileInfos (stats: fs.Stats): Promise<FileInfo[]> {
    return new Promise((resolve, reject) => {
      if (stats.isFile()) {
        this.convertFileStats(this.srcPath, stats).then(fileInfo => {
          resolve([fileInfo])
        }).catch(error => {
          reject(error)
        })
      } else if (stats.isDirectory()) {
        const fileInfos = this.deepTraverseDirectory(this.srcPath)
        resolve(fileInfos)
      }
    })
  }
  // 深遍历目录文件
  protected deepTraverseDirectory (directory: string): Promise<FileInfo[]> {
    return new Promise((resolve, reject) => {
      let fileInfos: FileInfo[] = []
      fs.readdirSync(directory).forEach(async filename => {
        const path = StringUtility.convertR2L(directory + '/' + filename)
        const stats = fs.statSync(path)
        if (stats.isDirectory()) {
          await this.deepTraverseDirectory(path).then(files => {
            fileInfos = fileInfos.concat(files)
          })
        } else {
          await this.convertFileStats(path, stats).then(fileInfo => {
            fileInfos.push(fileInfo)
          }).catch(error => {
            reject(error)
          })
        }
        resolve(fileInfos)
      })
    })
  }
  // 计算待上传文件的总大小
  private calculatorUploadFileSize () {
    let totalSize = 0
    this.fileInfos!.forEach(item => {
      totalSize += item.totalSize
      if (item.uploadedSize > 0) {
        this.completedBytes += item.uploadedSize
      }
    })
    this.countOfBytes = totalSize
  }
  // 处理上传错误回调
  private handlerTaskError (code: TaskErrorCode) {
    const error = new TaskError(code)
    this.status = TaskStatus.error
    this.emit('error', this.index, error)
  }
  // 递归读取上传多个文件
  private uploadFile () {
    // check status
    if (this.status !== TaskStatus.progress) return
    // check upload file
    const fileInfo = this.getUploadFileInfo()
    if (fileInfo === null) {
      this.status = TaskStatus.finished
      this.emit('taskFinished', this.index)
      return
    }
    // start upload
    FileHandle.openReadFileHandle(fileInfo.path).then(fd => { // open file handle success
      this.fileHandle = fd
      return this.uploadSingleFile(fd, fileInfo)
    }).then(fd => { // upload file data success
      return FileHandle.closeFileHandle(fd)
    }).then(() => { // close file handle success
      this.fileHandle = -1
      this.emit('fileFinished', this.index, _.cloneDeep(fileInfo))
      this.uploadFile()
    }).catch(error => { // handler error
      console.log(error)
      if (error instanceof TaskError) {
        this.handlerTaskError(error.code)
      } else if (error === FileHandleError.openError) {
        this.handlerTaskError(TaskErrorCode.openHandleError)
      } else {
        this.handlerTaskError(TaskErrorCode.closeHandleError)
      }
    })
  }
  // 获取待上传的文件对象
  private getUploadFileInfo () {
    for (let index = 0; index < this.fileInfos!.length; index++) {
      const item = this.fileInfos[index]
      if (item.uploadedSize < item.totalSize) return item
    }
    return null
  }
  // 上传单个文件
  private uploadSingleFile (fd: number, file: FileInfo): Promise<number> {
    return new Promise((resolve, reject) => {
      this.uploadFileChunk(fd, file, (bytes, error) => {
        if (!_.isEmpty(error) || bytes === undefined) {
          reject(error)
        } else {
          this.completedBytes += bytes
          this.emit('progress', this.index)
          const isCompleted = file.uploadedSize >= file.totalSize
          isCompleted && resolve(fd)
        }
      })
    })
  }
  // 递归读取上传文件块
  private uploadFileChunk (fd: number, file: FileInfo, completionHandler: (bytes?: number, error?: TaskError) => void) {
    let chunkLength = 0
    FileHandle.readFile(fd, file.uploadedSize, this.maxChunkSize).then(buffer => {
      chunkLength = buffer.length
      return this.uploadChunckData(file, buffer, this.source)
    }).then(response => {
      console.log(response)
      if (this.status !== TaskStatus.progress) return
      if (response.data.code !== 200) {
        const error = new TaskError(TaskErrorCode.serverError, response.data.msg)
        completionHandler(undefined, error)
      } else {
        file.uploadedSize += chunkLength
        completionHandler(chunkLength)
        if (file.uploadedSize < file.totalSize) this.uploadFileChunk(fd, file, completionHandler)
      }
    }).catch(error => {
      if (this.status !== TaskStatus.progress || axios.isCancel(error)) return
      if (error === FileHandleError.readError) {
        completionHandler(undefined, new TaskError(TaskErrorCode.readDataError))
      } else {
        completionHandler(undefined, new TaskError(TaskErrorCode.networkError))
      }
    })
  }
  handleTaskError (code: TaskErrorCode) {
    return new Promise((resolve, reject) => {
      const error = new TaskError(code)
      reject(error)
    })
  }
  // 生成上传参数
  private generateUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    return {
      uuid: this.uuid,
      path: this.destPath + '/' + fileInfo.name,
      start: fileInfo.uploadedSize,
      end: fileInfo.uploadedSize + chunkLength - 1,
      size: fileInfo.totalSize
    }
  }
  // protected methods
  /**转换stats */
  protected convertFileStats (path: string, stats: fs.Stats): Promise<FileInfo> {
    return new Promise(resolve => {
      const name = StringUtility.formatName(path)
      const fileInfo: FileInfo = {
        path,
        name,
        totalSize: stats.size,
        uploadedSize: 0,
      }
      resolve(fileInfo)
    })
  }
  /**上传文件数据 */
  protected uploadChunckData (file: FileInfo, buffer: Buffer, cancel?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    const params = this.generateUploadParams(file, buffer.length)
    return NasFileAPI.uploadData(params, buffer, cancel)
  }
}
