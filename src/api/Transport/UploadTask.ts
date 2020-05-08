// 上传工具类，支持目录和文件上传、断点续传
import _ from 'lodash'
import fs from 'fs'
import { EventEmitter } from 'events'
import NasFileAPI from '../NasFileAPI'
import { UploadParams } from '../NasFileModel'
import FileHandle, { FileHandleError } from '../../utils/FileHandle'
import { AxiosResponse, Canceler } from 'axios'
import { BasicResponse } from '../UserModel'

export default class UploadTask extends EventEmitter {
  readonly srcPath: string
  readonly destPath: string
  readonly uuid: string
  readonly maxChunkSize = 1 * 1024 * 1024 // 单次读取的最大字节数
  index: number = 0 // 任务标识符
  status: UploadStatus // 上传任务的状态 
  fileInfos: FileInfo[] = [] // 待上传的文件对象
  countOfBytes: number = 0 // 待上传文件总大小
  uploadedBytes: number = 0 // 已上传文件总大小
  cancelRequest?: Canceler // 上传取消请求标识
  private fileHandle = -1 // 标记当前正在操作的文件句柄
  
  constructor(srcPath: string, destPath: string, uuid: string) {
    super()
    this.srcPath = srcPath
    this.destPath = destPath
    this.uuid = uuid
    this.status = UploadStatus.pending
  }
  // public methods
  async start () {
    // 1. 改变任务状态
    this.status = UploadStatus.uploading
    // 2. 解析当前目录
    _.isEmpty(this.fileInfos) && await this.parseSourcePath(this.srcPath)
    // 3. 过滤掉空目录
    if (_.isEmpty(this.fileInfos)) {
      this.handlerUploadError(UploadErrorCode.pathError)
      return
    }
    // 4. 计算待上传文件的总大小
    this.calculatorUploadFileSize()
    // 5. 开始递归上传文件
    this.uploadFile()
  }
  cancel () {
    this.status = UploadStatus.error
    this.fileInfos = []
    if (this.fileHandle > 0) FileHandle.closeFileHandle(this.fileHandle)
    this.cancelRequest !== undefined && this.cancelRequest()
  }
  suspend () {
    this.status = UploadStatus.suspend
    if (this.fileHandle > 0) FileHandle.closeFileHandle(this.fileHandle)
    this.fileHandle = -1
    this.cancelRequest !== undefined && this.cancelRequest()
    this.cancelRequest = undefined
  }
  resume () {
    this.status = UploadStatus.uploading
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
      this.handlerUploadError(UploadErrorCode.readStatError)
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
  private deepTraverseDirectory (directory: string): Promise<FileInfo[]> {
    return new Promise((resolve, reject) => {
      let fileInfos: FileInfo[] = []
      fs.readdirSync(directory).forEach(async filename => {
        const path = directory + '/' + filename
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
        this.uploadedBytes += item.uploadedSize
      }
    })
    this.countOfBytes = totalSize
  }
  // 处理上传错误回调
  private handlerUploadError (code: UploadErrorCode) {
    const error = new UploadError(code)
    this.status = UploadStatus.error
    this.emit('error', this.index, error)
  }
  // 递归读取上传多个文件
  private uploadFile () {
    // check status
    if (this.status !== UploadStatus.uploading) {
      this.handlerUploadError(UploadErrorCode.cancel)
      return
    }
    // check upload file
    const fileInfo = this.getUploadFileInfo()
    if (fileInfo === null) {
      this.status = UploadStatus.finished
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
      if (error instanceof UploadError) {
        this.handlerUploadError(error.code)
      } else if (error === FileHandleError.openError) {
        this.handlerUploadError(UploadErrorCode.openHandleError)
      } else {
        this.handlerUploadError(UploadErrorCode.closeHandleError)
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
          this.uploadedBytes += bytes
          this.emit('progress', this.index)
          const isCompleted = file.uploadedSize >= file.totalSize
          isCompleted && resolve(fd)
        }
      })
    })
  }
  // 递归读取上传文件块
  private uploadFileChunk (fd: number, file: FileInfo, completionHandler: (bytes?: number, error?: UploadError) => void) {
    let chunkLength = 0
    FileHandle.readFile(fd, file.uploadedSize, this.maxChunkSize).then(buffer => {
      chunkLength = buffer.length
      return this.uploadChunckData(file, buffer, this.cancelRequest)
    }).then(response => {
      if (this.status !== UploadStatus.uploading) {
        const error = new UploadError(UploadErrorCode.cancel)
        completionHandler(undefined, error)
      } else if (response.data.code !== 200) {
        const error = new UploadError(UploadErrorCode.uploadInnerError, response.data.msg)
        completionHandler(undefined, error)
      } else {
        file.uploadedSize += chunkLength
        completionHandler(chunkLength)
        if (file.uploadedSize < file.totalSize) this.uploadFileChunk(fd, file, completionHandler)
      }
    }).catch(error => {
      if (this.status !== UploadStatus.uploading) {
        const error = new UploadError(UploadErrorCode.cancel)
        completionHandler(undefined, error)
      } else if (error === FileHandleError.readError) {
        completionHandler(undefined, new UploadError(UploadErrorCode.readDataError))
      } else {
        completionHandler(undefined, new UploadError(UploadErrorCode.networkError))
      }
    })
  }
  handleUploadError (code: UploadErrorCode) {
    return new Promise((resolve, reject) => {
      const error = new UploadError(code)
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
      const start = this.srcPath.lastIndexOf('/')
      const name = path.substring(start, path.length)
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
  protected uploadChunckData (file: FileInfo, buffer: Buffer, cancel?: Canceler): Promise<AxiosResponse<BasicResponse>> {
    const params = this.generateUploadParams(file, buffer.length)
    return NasFileAPI.uploadData(params, buffer, cancel)
  }
}

interface FileInfo {
  name: string,
  path: string,
  totalSize: number,
  uploadedSize: number,
  md5?: string
}

class UploadError {
  code: UploadErrorCode
  desc: string
  constructor (code: number, desc?: string) {
    this.code = code
    this.desc = desc === undefined ? this.matchNormalErrorDesc(code) : desc
  }
  matchNormalErrorDesc (code: UploadErrorCode) {
    switch (code) {
      case UploadErrorCode.openHandleError:
        return 'open file handle error'
      case UploadErrorCode.closeHandleError:
        return 'close file handle error'
      case UploadErrorCode.readStatError:
        return 'read file stat error'
      case UploadErrorCode.readDataError:
        return 'read file data error'
      case UploadErrorCode.uploadInnerError:
        return 'upload interface inner error'
      case UploadErrorCode.networkError:
        return 'network error'
      case UploadErrorCode.pathError:
        return 'upload file directory is empty'
      case UploadErrorCode.cancel:
        return 'upload task was cancelled'
      default:
        return 'unkown'
    }
  }
}

enum UploadErrorCode {
  unkown = -1,
  openHandleError,
  closeHandleError,
  readStatError,
  readDataError,
  networkError,
  uploadInnerError,
  pathError,
  cancel
}

enum UploadStatus {
  pending,
  uploading,
  suspend,
  finished,
  error
}

export {
  FileInfo,
  UploadErrorCode,
  UploadError,
  UploadStatus
}
