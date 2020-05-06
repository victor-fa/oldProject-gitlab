// 上传工具类，支持目录和文件上传、断点续传
import _ from 'lodash'
import fs from 'fs'
import { EventEmitter } from 'events'
import NasFileAPI from '../NasFileAPI'
import { UploadParams } from '../NasFileModel'
import FileHandle, { FileHandleError } from '../../utils/FileHandle'
import { AxiosResponse, Canceler } from 'axios'
import { BasicResponse } from '../UserModel'
import StringUtility from '../../utils/StringUtility'

const maxChunkSize = 1 * 1024 * 1024 // 单次读取的最大字节数

interface FileInfo {
  name: string,
  path: string,
  totalSize: number,
  uploadedSize: number
}

export default class UploadTask extends EventEmitter {
  readonly srcPath: string
  readonly destPath: string
  readonly uuid: string
  index: number = 0 // 任务标识符
  status: UploadStatus // 上传任务的状态 
  fileInfos: FileInfo[] = [] // 待上传的文件对象
  countOfBytes: number = 0 // 待上传文件总大小
  uploadedBytes: number = 0 // 已上传文件总大小
  private cancelRequest?: Canceler // 上传请求标识
  private isCancel = false // 标记当前任务是否取消
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
    _.isEmpty(this.fileInfos) && (this.fileInfos = await this.parseSourcePath(this.srcPath))
    // 3. 过滤掉空目录
    if (_.isEmpty(this.fileInfos)) {
      this.handlerUploadError(UploadErrorCode.pathError)
      return
    }
    // 4. 计算待上传文件的总大小
    this.countOfBytes = this.calculatorUploadFileSize()
    // 5. 开始递归上传文件
    this.uploadFile()
  }
  suspend () {
    this.isCancel = true
    if (this.fileHandle > 0) FileHandle.closeFileHandle(this.fileHandle)
  }
  resume () {
    this.isCancel = false
    this.uploadFile()
  }
  cancel () {
    this.suspend()
    this.fileInfos = []
    this.cancelRequest !== undefined && this.cancelRequest()
  }
  // pricvate methods 
  // 解析文件源路径
  private async parseSourcePath (path: string) {
    let fileInfos: FileInfo[] = []
    await FileHandle.statFile(path).then(stats => {
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
    const start = this.srcPath.lastIndexOf('/')
    const name = path.substring(start, path.length)
    return {
      path,
      name,
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
  // 处理上传错误回调
  private handlerUploadError (code: UploadErrorCode) {
    const error = new UploadError(code)
    this.status = UploadStatus.error
    this.emit('error', this.index, error)
  }
  // 递归读取上传多个文件
  private uploadFile () {
    if (this.isCancel) return
    const fileInfo = this.getUploadFileInfo()
    if (fileInfo === null) {
      this.status = UploadStatus.completed
      this.emit('taskFinished', this.index)
      return
    }
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
    if (this.isCancel) return
    let chunkLength = 0
    FileHandle.readFile(fd, file.uploadedSize, maxChunkSize).then(buffer => {
      if (this.isCancel) return Promise.reject(UploadErrorCode.cancel)
      chunkLength = buffer.length
      if (this.isCancel) return Promise.reject(Error('cancel upload task'))
      return this.uploadChunckData(file, buffer, this.cancelRequest)
    }).then(response => {
      console.log(response)
      if (response.data.code !== 200) {
        if (response.data.code === 4050) {
          console.log('文件已存在');
        } else {
          completionHandler(undefined, new UploadError(UploadErrorCode.uploadInnerError))
        }
        return
      }
      file.uploadedSize += chunkLength
      completionHandler(chunkLength)
      if (file.uploadedSize < file.totalSize) this.uploadFileChunk(fd, file, completionHandler)
    }).catch(error => {
      if (error instanceof UploadError) {
        completionHandler(undefined, error as UploadError)
      } else {
        // completionHandler(undefined, new UploadError(UploadErrorCode.networkError))
      }
    })
  }
  // 生成上传参数
  private generateUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    return {
      uuid: this.uuid,
      path: this.destPath + '/' + StringUtility.formatName(fileInfo.name.replace(new RegExp("\\\\", "g"), '/')),
      start: fileInfo.uploadedSize,
      end: fileInfo.uploadedSize + chunkLength - 1,
      size: fileInfo.totalSize
    }
  }
  // protected methods
  protected uploadChunckData (file: FileInfo, buffer: Buffer, cancel?: Canceler): Promise<AxiosResponse<BasicResponse>> {
    const params = this.generateUploadParams(file, buffer.length)
    return NasFileAPI.uploadData(params, buffer, cancel)
  }
}

enum UploadErrorCode {
  openHandleError,
  closeHandleError,
  readStatError,
  readDataError,
  uploadInnerError,
  networkError,
  pathError,
  cancel
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
      case UploadErrorCode.cancel:
        return 'upload task was cancelled'
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
  UploadErrorCode,
  UploadError,
  UploadStatus
}
