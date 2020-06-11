// 上传工具类，支持目录和文件上传、断点续传
import _ from 'lodash'
import fs from 'fs'
import BaseTask, { FileInfo, TaskStatus, TaskErrorCode, TaskError } from './BaseTask'
import NasFileAPI from '../NasFileAPI'
import { UploadParams } from '../NasFileModel'
import FileHandle, { FileHandleError } from '../../utils/FileHandle'
import axios, { AxiosResponse, CancelTokenSource } from 'axios'
import { BasicResponse } from '../UserModel'
import StringUtility from '@/utils/StringUtility'
import path from 'path'

const CancelToken = axios.CancelToken
let tmpFileInfos: FileInfo[] = []

export default class UploadTask extends BaseTask {
  private directory: string // 上传文件的目录
  source? = CancelToken.source() // 下载取消请求标识
  private fileHandle = -1 // 标记当前正在操作的文件句柄

  constructor(srcPath: string, destPath: string, uuid: string) {
    super(srcPath, destPath, uuid)
    this.directory = path.dirname(srcPath)
    this.source = CancelToken.source()
  }
  // public methods
  async start () {
    super.start()
    // 1. 解析当前目录
    _.isEmpty(this.fileInfos) && await this.parseSourcePath(this.srcPath)
    // 2. 计算待上传文件的总大小
    this.calculatorUploadFileSize()
    // 3. 开始递归上传文件
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
    this.source = CancelToken.source()
    this.uploadFile()
  }
  reload () {
    super.reload()
    this.source = CancelToken.source()
  }
  // pricvate methods
  // 解析文件源路径
  private async parseSourcePath (path: string) {
    await FileHandle.statFile(path).then(stats => {
      return this.getUploadFileInfos(stats)
    }).then(fileInfos => {
      console.log(fileInfos);
      this.fileInfos = _.cloneDeep(fileInfos)
      console.log(this.fileInfos);
      tmpFileInfos = []
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
        this.deepTraverseDirectory(this.srcPath).then(fileInfos => {
          resolve(fileInfos)
        }).catch(error => {
          reject(error)
        })
      }
    })
  }
  // 深遍历目录文件
  protected deepTraverseDirectory (directory: string): Promise<FileInfo[]> {
    return new Promise(async (resolve, reject) => {
      const stats = fs.statSync(directory)
      await this.convertFileStats(directory, stats).then(fileInfo => {
        tmpFileInfos.push(fileInfo)
      })
      fs.readdirSync(directory).forEach(async filename => {
        const path = StringUtility.convertR2L(directory + '/' + filename)
        const stats = fs.statSync(path)
        if (stats.isDirectory()) {
          await this.deepTraverseDirectory(path).then(fileInfos => {
            resolve(tmpFileInfos.concat(fileInfos))
          })
        } else {
          await this.convertFileStats(path, stats).then(fileInfo => {
            tmpFileInfos.push(fileInfo)
            resolve(tmpFileInfos)
          }).catch(error => {
            reject(error)
          })
        }
      })
    })
  }
  // 计算待上传文件的总大小
  private calculatorUploadFileSize () {
    this.countOfBytes = 0
    this.completedBytes = 0
    this.fileInfos.forEach(item => {
      this.countOfBytes += item.totalSize
      this.completedBytes += item.completedSize
    })
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
    if (fileInfo.isDirectory === true || fileInfo.totalSize <= 0) {
      this.creatFolder(fileInfo)
    } else {
      this.startUpload(fileInfo)
    }    
  }
  // 创建文件夹
  private creatFolder (fileInfo: FileInfo) {
    NasFileAPI.newFolder(fileInfo.destPath, this.uuid).then(response => {
      console.log(response)
      if (response.data.code !== 200) return
      fileInfo.newCompleted = true
      this.emit('fileFinished', this.index, _.cloneDeep(fileInfo))
      this.uploadFile()
    }).catch(_ => {
      fileInfo.newCompleted = true
      this.uploadFile()
    })
  }
  // 开始上传文件数据
  private startUpload (fileInfo: FileInfo) {
    FileHandle.openReadFileHandle(fileInfo.srcPath).then(fd => { // open file handle success
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
      if (item.isDirectory === true) {
        if (item.newCompleted !== true) return item
      } else {
        if (item.completedSize < item.totalSize) return item
      }
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
          const isCompleted = file.completedSize >= file.totalSize
          isCompleted && resolve(fd)
        }
      })
    })
  }
  // 递归读取上传文件块
  private uploadFileChunk (fd: number, file: FileInfo, completionHandler: (bytes?: number, error?: TaskError) => void) {
    let chunkLength = 0
    FileHandle.readFile(fd, file.completedSize, this.maxChunkSize).then(buffer => {
      chunkLength = buffer.length
      return this.uploadChunckData(file, buffer, this.source)
    }).then(response => {
      console.log(response)
      if (this.status !== TaskStatus.progress) return
      if (response.data.code !== 200) {
        const desc = response.data.code === 4050 ? `${file.name}已存在，请重命名后再上传` : response.data.msg
        const error = new TaskError(TaskErrorCode.serverError, desc)
        completionHandler(undefined, error)
      } else {
        file.completedSize += chunkLength
        completionHandler(chunkLength)
        if (file.completedSize < file.totalSize) this.uploadFileChunk(fd, file, completionHandler)
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
      path: fileInfo.destPath,
      start: fileInfo.completedSize,
      end: fileInfo.completedSize + chunkLength - 1,
      size: fileInfo.totalSize
    }
  }
  // protected methods
  /**转换stats */
  protected convertFileStats (path: string, stats: fs.Stats): Promise<FileInfo> {
    return new Promise(resolve => {
      const name = StringUtility.formatName(path)
      const relativePath = path.substring(this.directory.length, path.length)
      const fileInfo: FileInfo = {
        name,
        relativePath,
        srcPath: path,
        destPath: `${this.destPath}${relativePath}`,
        totalSize: stats.size,
        completedSize: 0,
        isDirectory: stats.isDirectory()
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
