// 上传工具类，支持目录和文件上传、断点续传
import _ from 'lodash'
import fs from 'fs'
import BaseTask, { FileInfo, TaskStatus, TaskErrorCode, TaskError } from './BaseTask'
import NasFileAPI from '../NasFileAPI'
import { UploadParams } from '../NasFileModel'
import FileHandle, { FileHandleError } from '@/utils/FileHandle'
import axios, { AxiosResponse, CancelTokenSource } from 'axios'
import { BasicResponse } from '../UserModel'
import StringUtility from '../../utils/StringUtility'
import path from 'path'
import ResourceHandler from '@/views/MainView/ResourceHandler'

const CancelToken = axios.CancelToken
let tmpFileInfos: FileInfo[] = []

export default class UploadTask extends BaseTask {
  private directory: string // 上传文件的目录
  private source? = CancelToken.source() // 下载取消请求标识
  private fileHandle = -1 // 标记当前正在操作的文件句柄
  private previousSize = 0
  private speedTimer?: NodeJS.Timeout

  constructor(srcPath: string, destPath: string, uuid: string) {
    super(srcPath, destPath, uuid)
    this.directory = StringUtility.formatDirectory(srcPath)
    this.source = CancelToken.source()
    this.type = 'upload'
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
    // 4. 开启速度定时器
    this.beginSpeedTimer()
  }
  async cancel () {
    super.cancel()
    this.fileInfos = []
    if (this.fileHandle !== -1) {
      FileHandle.closeFileHandle(this.fileHandle)
      this.fileHandle = -1
    }
    if (this.source !== undefined) {
      this.source.cancel()
      this.source = undefined
    }
  }
  suspend () {
    super.suspend()
    if (this.fileHandle !== -1) {
      FileHandle.closeFileHandle(this.fileHandle)
      this.fileHandle = -1
    }
    if (this.source !== undefined) {
      this.source.cancel()
      this.source = undefined
    }
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
  matchTaskIcon () {
    if (!_.isEmpty(this.icon)) return
    ResourceHandler.matchLocalPathIcon(this.srcPath).then(icon => {
      this.icon = icon
    }).catch(error => {
      console.log(error)
      this.icon = require('../../assets/resource/unkonw_icon.png')
    })
  }
  // pricvate methods
  // 解析文件源路径
  private async parseSourcePath (path: string) {
    await FileHandle.statFile(path).then(stats => {
      return this.generateUploadFileInfos(stats)
    }).then(fileInfos => {
      this.fileInfos = _.cloneDeep(fileInfos)
      tmpFileInfos = []
    }).catch(_ => {
      this.handlerTaskError(TaskErrorCode.readStatError)
    })
  }
  // 获取需要上传的文件对象
  private generateUploadFileInfos (stats: fs.Stats): Promise<FileInfo[]> {
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
  protected async deepTraverseDirectory (directory: string): Promise<FileInfo[]> {
    return new Promise(async (resolve, reject) => {
      const stats = fs.statSync(directory)
      await this.convertFileStats(directory, stats).then(fileInfo => {
        tmpFileInfos.push(fileInfo)
      })
      const files = fs.readdirSync(directory)
      if (_.isEmpty(files)) {
        resolve(tmpFileInfos)
      } else {
        files.forEach(async filename => {
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
      }
    })
  }
  // 开启计算速度定时器
  beginSpeedTimer () {
    this.speedTimer = setInterval(() => {
      if (this.previousSize >= this.completedBytes) return
      const speed = this.completedBytes - this.previousSize // 单位B/s
      this.speed = StringUtility.formatSpeed(speed)
      this.previousSize = this.completedBytes
    }, 2000)
  }
  // 清除定时器
  clearSpeedTimer () {
    if (this.speedTimer !== undefined) {
      clearInterval(this.speedTimer)
    }
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
  private handlerTaskError (code: TaskErrorCode, desc?: string) {
    this.speed = ''
    const error = new TaskError(code, desc)
    this.status = TaskStatus.error
    this.error = error
    this.emit('error', this.taskId, error)
    this.clearSpeedTimer()
  }
  // 递归读取上传多个文件
  protected uploadFile () {
    // check status
    if (this.status !== TaskStatus.progress) return
    // check upload file
    const fileInfo = this.getNextFileInfo()
    if (fileInfo === null) {
      this.status = TaskStatus.finished
      this.name = path.basename(this.srcPath)
      this.emit('taskFinished', this.taskId)
      this.clearSpeedTimer()
      return
    }
    if (fileInfo.isDirectory === true) {
      this.createFolder(fileInfo)
    } else {
      this.filterFilesInfo(fileInfo).then(isFilter => {
        if (isFilter) {
          fileInfo.filter = true
          this.uploadFile()
        } else {
          this.startUpload(fileInfo)
        }
      })
    }    
  }
  // 创建文件夹
  private createFolder (fileInfo: FileInfo) {
    this.name = fileInfo.relativePath
    if (this.fileInfos.length > 1) this.emit('fileBegin', this.taskId, fileInfo)
    this.completedBytes += fileInfo.totalSize
    NasFileAPI.newFolder(fileInfo.destPath, this.uuid).then(response => {
      console.log(response)
      if (response.data.code !== 200) return
      fileInfo.completed = true
      if (this.fileInfos.length > 1) this.emit('fileFinished', this.taskId, _.cloneDeep(fileInfo))
      this.uploadFile()
    }).catch(_ => {
      fileInfo.completed = true
      this.uploadFile()
    })
  }
  // 开始上传文件数据
  private startUpload (fileInfo: FileInfo) {
    this.name = fileInfo.relativePath
    if (this.fileInfos.length > 1) this.emit('fileBegin', this.taskId, fileInfo)
    FileHandle.openReadFileHandle(fileInfo.srcPath).then(fd => { // open file handle success
      this.fileHandle = fd
      return this.uploadSingleFile(fd, fileInfo)
    }).then(fd => { // upload file data success
      return FileHandle.closeFileHandle(fd)
    }).then(() => { // close file handle success
      this.fileHandle = -1
      if (this.fileInfos.length > 1) this.emit('fileFinished', this.taskId, _.cloneDeep(fileInfo))
      this.uploadFile()
    }).catch(error => { // handler error
      if (this.fileHandle !== -1) FileHandle.closeFileHandle(this.fileHandle)
      if (error instanceof TaskError) {
        this.handlerTaskError(error.code, error.desc)
      } else if (error === FileHandleError.openError) {
        this.handlerTaskError(TaskErrorCode.openHandleError)
      } else {
        this.handlerTaskError(TaskErrorCode.closeHandleError)
      }
    })
  }
  // 获取待上传的文件对象
  private getNextFileInfo () {
    for (let index = 0; index < this.fileInfos.length; index++) {
      const item = this.fileInfos[index]
      if (item.filter === true) continue
      if (item.completed === true) continue
      return item
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
          this.emit('progress', this.taskId)
          const isCompleted = file.completedSize >= file.totalSize
          file.completed = isCompleted
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
      if (this.status !== TaskStatus.progress) return
      if (response.data.code === 4050) {
        file.completedSize = file.totalSize
        completionHandler(file.completedSize)
      } else if (response.data.code !== 200) {
        const error = new TaskError(TaskErrorCode.serverError, response.data.msg)
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
  // 生成上传参数
  private generateUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    const end = chunkLength === 0 ? chunkLength : fileInfo.completedSize + chunkLength - 1
    return {
      end,
      uuid: this.uuid,
      path: fileInfo.destPath,
      start: fileInfo.completedSize,
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
  // 过滤（备份加密用）
  protected filterFilesInfo (fileInfo: FileInfo): Promise<Boolean> {
    return Promise.resolve(false)
  }
  /**上传文件数据 */
  protected uploadChunckData (file: FileInfo, buffer: Buffer, cancel?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    const params = this.generateUploadParams(file, buffer.length)
    return NasFileAPI.uploadData(params, buffer, cancel)
  }
}
