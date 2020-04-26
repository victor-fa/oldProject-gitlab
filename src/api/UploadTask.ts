// 上传工具类，支持目录和文件上传、断点续传
import _ from 'lodash'
import fs from 'fs'
import NasFileAPI from './NasFileAPI'
import { UploadParams } from './NasFileModel'
import fileHandle, { FileHandleError } from '../utils/FileHandle'
import { AxiosResponse, Canceler } from 'axios'
import { BasicResponse } from './UserModel'

const maxChunkSize = 1 * 1024 * 1024 // 单次读取的最大字节数

interface FileInfo {
  path: string,
  totalSize: number,
  uploadedSize: number,
  // 将目录子文件对象集合中最后一个item的isLast置为true
  // 可根据这个字段来判断目录文件是否全部上传完成
  isLast?: boolean
}

interface UploadTaskDelegate {
  // 上传任务更新进度回调
  uploadTaskProcessChange: (task: UploadTask) => void,
  // 上传任务单个文件完成回调 (当源路径是是目录时才会调用)
  fileInfoStatusChange: (task: UploadTask, fileInfo: FileInfo) => void,
  // 上传任务状态改变回调
  uploadTaskStatusChange: (task: UploadTask, error?: UploadError) => void
}

class UploadTask {
  readonly srcPath: string
  readonly destPath: string
  readonly uuid: string
  index: number = 0 // 任务标识符
  status: UploadStatus // 上传任务的状态 
  fileInfos: FileInfo[] = [] // 待上传的文件对象
  countOfBytes: number = 0 // 待上传文件总大小
  countOfBytesUploaded: number = 0 // 已上传文件总大小
  delegate?: UploadTaskDelegate // 上传任务代理
  cancelTask?: Canceler // 上传请求标识
  private isCancel = false // 标记当前任务是否取消
  private fileHandle = -1 // 标记当前正在操作的文件句柄

  constructor(srcPath: string, destPath: string, uuid: string) {
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
    _.isEmpty(this.fileInfos) && (this.fileInfos = await this.parseSourcePath(this.srcPath))
    // 3. 过滤掉空目录
    if (_.isEmpty(this.fileInfos)) {
      this.handlerUploadError(UploadErrorCode.pathError)
      return
    }
    // 4. 计算待上传文件的总大小
    this.countOfBytes = this.calculatorUploadFileSize()
    // 5. 标记最后一个目录文件对象
    if (this.fileInfos.length > 1) _.last(this.fileInfos)!.isLast = true
    // 6. 开始递归上传文件
    this.uploadFile()
  }
  suspend () {
    this.isCancel = true
    if (this.fileHandle > 0) fileHandle.closeFileHandle(this.fileHandle)
  }
  resume () {
    this.isCancel = false
    this.uploadFile()
  }
  cancel () {
    this.suspend()
    this.fileInfos = []
    this.delegate = undefined
    this.cancelTask !== undefined && this.cancelTask()
  }
  // pricvate methods 
  // 解析文件源路径
  private async parseSourcePath (path: string) {
    let fileInfos: FileInfo[] = []
    await fileHandle.statFile(path).then(stats => {
      fileInfos = this.getUploadFileInfos(stats)
    }).catch(_ => {
      this.handlerUploadError(UploadErrorCode.readStatError)
    })
    return fileInfos
  } 
  // 获取需要上传的文件对象
  private getUploadFileInfos (stats: fs.Stats) {
    if (stats.isFile()) {
      const fileInfo = this.convertFileStats(this.srcPath, stats)
      return [fileInfo]
    } else if (stats.isDirectory()) {
      return this.deepTraverseDirectory(this.srcPath)
    }
    return []
  }
  // 处理上传错误回调
  handlerUploadError (code: UploadErrorCode) {
    const error = new UploadError(code)
    this.status = UploadStatus.error
    this.delegate !== undefined && this.delegate.uploadTaskStatusChange(this, error)
  }
  // 深遍历目录文件
  private deepTraverseDirectory (directory: string) {
    let subpaths: FileInfo[] = []
    fs.readdirSync(directory).forEach(filename => {
      const path = directory + '/' + filename
      const stats = fs.statSync(path)
      if (stats.isDirectory()) {
        subpaths = subpaths.concat(this.deepTraverseDirectory(path))
      } else {
        const fileInfo = this.convertFileStats(path, stats)
        subpaths.push(fileInfo)
      }
    })
    return subpaths
  }
  // 转换stats
  private convertFileStats (path: string, stats: fs.Stats): FileInfo {
    return {
      path,
      totalSize: stats.size,
      uploadedSize: 0,
    }
  }
  // 计算待上传文件的总大小
  private calculatorUploadFileSize () {
    let totalSize = 0
    this.fileInfos!.forEach(item => {
      totalSize += item.totalSize
    })
    return totalSize
  }
  // 递归读取上传多个文件
  private uploadFile () {
    if (this.isCancel) return
    const fileInfo = this.getUploadFileInfo()
    if (fileInfo === null) {
      this.status = UploadStatus.completed
      !_.isEmpty(this.delegate) && this.delegate!.uploadTaskStatusChange(this)
      return
    }
    fileHandle.openFileHandle(fileInfo.path).then(fd => { // open file handle success
      this.fileHandle = fd
      return this.uploadSingleFile(fd, fileInfo)
    }).then(fd => { // upload file data success
      return fileHandle.closeFileHandle(fd)
    }).then(() => { // close file handle success
      this.fileHandle = -1
      !_.isEmpty(this.delegate) && this.delegate!.fileInfoStatusChange(this, fileInfo)
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
      const item = this.fileInfos![index]
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
          this.countOfBytesUploaded += bytes
          this.delegate !== undefined && this.delegate.uploadTaskProcessChange(this)
          const isCompleted = file.uploadedSize >= file.totalSize
           isCompleted && resolve(fd)
        }
      })
    })
  }
  // 递归读取上传文件块
  private uploadFileChunk (fd: number, file: FileInfo, completionHandler: (bytes?: number, error?: UploadError) => void) {
    if (this.isCancel) return
    let chunkLength = 0
    fileHandle.readFile(fd, file.uploadedSize, maxChunkSize).then(buffer => {
      const params = this.generateUploadParams(file, buffer.length)
      chunkLength = buffer.length
      if (this.isCancel) return Promise.reject(Error('cancel upload task'))
      // return NasFileAPI.uploadData(params, buffer, this.requestTask)
      console.log(`path: ${file.path}, uploaded: ${file.uploadedSize}, total: ${file.totalSize}`)
      // const date = new Date()
      // console.log(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
      return this.testUpload(params, buffer, this.cancelTask)
    }).then(response => {
      if (response.data.code !== 200) {
        completionHandler(undefined, new UploadError(UploadErrorCode.uploadInnerError))
        return
      }
      file.uploadedSize += chunkLength
      completionHandler(chunkLength)
      const isCompleted = file.uploadedSize >= file.totalSize
      /*!isCompleted && this.uploadFileChunk(fd, file, completionHandler)*/
    }).catch(error => {
      if (error instanceof UploadError) {
        completionHandler(undefined, error as UploadError)
      } else {
        completionHandler(undefined, new UploadError(UploadErrorCode.networkError))
      }
    })
  }
  private testUpload (params: UploadParams, buffer: Buffer, cancel?: Canceler): Promise<AxiosResponse<BasicResponse>> {
    return new Promise((resolve, reject) => {
      const response: AxiosResponse<BasicResponse> = {
        status: 200,
        statusText: '',
        headers: null,
        config: {},
        data: {
          code: 200,
          msg: '',
          data: null
        }
      }
      setTimeout(() => {
        cancel = { } as Canceler
        resolve(response)
      }, 1000);
    })
  }
  // 生成上传参数
  private generateUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    return {
      uuid: this.uuid,
      path: this.destPath,
      start: fileInfo.uploadedSize,
      end: fileInfo.uploadedSize + chunkLength,
      size: fileInfo.totalSize
    }
  }
}

enum UploadErrorCode {
  openHandleError,
  closeHandleError,
  readStatError,
  readDataError,
  uploadInnerError,
  networkError,
  pathError
}
class UploadError {
  code: UploadErrorCode
  desc: string
  constructor (code: number, json?: string) {
    this.code = code
    this.desc = this.matchNormalErrorDesc(code)
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
      default:
        return 'unkown'
    }
  }
}

enum UploadStatus {
  pending,
  uploading,
  completed,
  error
}

export {
  FileInfo,
  UploadTask,
  UploadErrorCode,
  UploadError,
  UploadStatus,
  UploadTaskDelegate
}
