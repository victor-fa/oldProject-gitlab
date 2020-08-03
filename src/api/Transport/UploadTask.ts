// 上传工具类，支持目录和文件上传、断点续传
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import axios from 'axios'
import crypto from 'crypto'
import NasFileAPI from '../NasFileAPI'
import { UploadParams } from '../NasFileModel'
import StringUtility from '../../utils/StringUtility'
import ResourceHandler from '@/views/MainView/ResourceHandler'
import FileHandle, { FileHandleError } from '@/utils/FileHandle'
import BaseTask, { FileInfo, TaskStatus, TaskErrorCode, TaskError, FileChunk } from './BaseTask'

const CancelToken = axios.CancelToken

export default class UploadTask extends BaseTask {
  protected fileHandle = -1 // 标记当前正在操作的文件句柄
  protected buffer?: Buffer // 上传缓存区 
  private directory: string // 上传文件的目录
  protected source? = CancelToken.source() // 下载取消请求标识
  private retryCount = 6 // 分片最大重试次数

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
    // 3. 改变任务状态
    this.status = TaskStatus.progress
    // 4. 开始递归上传文件
    this.uploadFile()
    // 5. 发送事件
    this.emit('taskBegin', this.taskId)
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
    this.emit('taskSuspend', this.taskId)
  }
  resume () {
    super.resume()
    this.source = CancelToken.source()
    this.emit('taskResume', this.taskId)
    this.uploadFile()
  }
  reload () {
    super.reload()
    this.source = CancelToken.source()
  }
  matchTaskIcon () {
    if (!_.isEmpty(this.icon)) return
    const icon = ResourceHandler.matchLocalPathIcon(this.srcPath)
    if (_.isEmpty(icon)) {
      this.icon = require('../../assets/resource/unkonw_icon.png')
    } else {
      this.icon = icon
    }
  }
  // pricvate methods
  // 解析文件源路径
  private async parseSourcePath (path: string) {
    try {
      const stats = await FileHandle.statFile(path)
      const files = await this.generateUploadFileInfos(stats)
      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        if (file.isDirectory) continue
        const md5 = await this.calculateFileMD5(file)
        file.md5 = md5
      }
      this.fileInfos = files
    } catch (error) {
      this.handlerTaskError(TaskErrorCode.parsePathError)
    }
  }
  // 获取需要上传的文件对象
  private generateUploadFileInfos (stats: fs.Stats): Promise<FileInfo[]> {
    return new Promise((resolve) => {
      let files: FileInfo[] = []
      if (stats.isFile()) {
        const fileInfo = this.convertFileStats(this.srcPath, stats)
        files = [fileInfo]
      } else if (stats.isDirectory()) {
        const fileInfos = FileHandle.deepTraverseDirectory(this.srcPath).map(file => {
          return this.convertFileStats(file.absolutePath, file.stats)
        })
        files = fileInfos
      }
      resolve(files)
    })
  }
  // 计算文件的MD5值
  private calculateFileMD5 (file: FileInfo): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!_.isEmpty(file.md5)) {
        resolve(file.md5!)
        return
      }
      const stream = fs.createReadStream(file.srcPath)
      const fsHash = crypto.createHash('md5')
      stream.on('data', data => {
        fsHash.update(data)
      })
      stream.once('end', () => {
        const md5 = fsHash.digest('hex')
        resolve(md5)
      })
      stream.once('error', error => {
        console.log(error)
        reject(new TaskError(TaskErrorCode.calMD5Error))
      })
    })
  }
  // 转换stats 
  private convertFileStats (path: string, stats?: fs.Stats): FileInfo {
    const name = StringUtility.formatName(path)
    const relativePath = path.substring(this.directory.length + 1, path.length)
    const size = stats === undefined ? 0 : stats.size
    const isDirectory = stats === undefined
    const destDir = isDirectory ? `${this.srcPath}/${name}` : undefined
    const chunks = this.splitFileChunks(size)
    return {
      name,
      relativePath,
      srcPath: path,
      destPath: `${this.destPath}/${relativePath}`,
      totalSize: size,
      completedSize: 0,
      isDirectory: stats === undefined,
      destDir,
      chunks
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
  // 生成文件分片集合
  protected splitFileChunks (totalSize: number) {
    if (totalSize === 0) return undefined
    const count = Math.ceil(totalSize / this.maxChunkSize)
    const chunks: FileChunk[] = [] 
    for (let index = 0; index < count; index++) {
      const position = this.maxChunkSize * index
      const length = index !== count - 1 ? this.maxChunkSize : totalSize - position
      const errorCount = 0
      chunks.push({ position, length, errorCount })
    }
    return chunks
  }
  // 处理上传错误回调
  protected handlerTaskError (code: TaskErrorCode, desc?: string) {
    this.speed = ''
    const error = new TaskError(code, desc)
    this.status = TaskStatus.error
    this.error = error
    this.emit('error', this.taskId, error)
    this.clearSpeedTimer()
    if (this.fileHandle !== -1) FileHandle.closeFileHandle(this.fileHandle)
    this.fileHandle = -1
  }
  // 递归读取上传多个文件
  protected uploadFile () {
    const file = this.getNextFileInfo()
    if (file === null) {
      this.status = TaskStatus.finished
      this.name = path.basename(this.srcPath)
      this.emit('taskFinished', this.taskId)
      this.clearSpeedTimer()
      return
    }
    if (this.status !== TaskStatus.progress) return
    this.filterFilesInfo(file).then(isFilter => {
      if (isFilter) {
        file.filter = true
        this.uploadFile() // upload next file
        return
      }
      file.isDirectory === true ? this.createFolder(file) : this.prepareFileUpload(file)
    }).catch(error => {
      file.isDirectory === true ? this.createFolder(file) : this.prepareFileUpload(file)
    })
  }
  // 创建文件夹
  private createFolder (fileInfo: FileInfo) {
    if (this.fileInfos.length > 1) {
      this.name = fileInfo.relativePath
      this.emit('fileBegin', this.taskId)
    }
    this.completedBytes += fileInfo.totalSize
    this.createFolderRequest(fileInfo).then(response => {
      console.log(response)
      if (response.data.code !== 200) {
        this.handlerTaskError(TaskErrorCode.serverError, response.data.msg)
      } else {
        fileInfo.completed = true
        if (this.fileInfos.length > 1) this.emit('fileFinished', this.taskId)
        this.uploadFile()
      }
    }).catch(error => {
      console.log(error)
      this.handlerTaskError(TaskErrorCode.networkError)
    })
  }
  // 新建文件请求
  protected createFolderRequest (file: FileInfo) {
    return NasFileAPI.newFolder(file.destPath, this.uuid)
  }
  // 准备上传文件数据
  private prepareFileUpload (file: FileInfo) {
    if (this.fileInfos.length > 1)  {
      this.name = file.relativePath
      this.emit('fileBegin', this.taskId)
    }
    this.startFileUpload(file)
  }
  // 开始上传文件数据
  protected startFileUpload (file: FileInfo) {
    FileHandle.openReadFileHandle(file.srcPath).then(fd => { // 1. open file handle success
      if (this.status !== TaskStatus.progress) return Promise.reject(new Error('cancel'))
      this.fileHandle = fd
      if (file.isCreated === true) return Promise.reject(new Error('isCreated'))
      return NasFileAPI.uploadMultipartBegin(file.destPath, this.uuid, file.totalSize, file.destDir)
    }).then(response => { // 2. upload begin request
      if (this.status !== TaskStatus.progress) return
      if (response.data.code !== 200) {
        this.handlerTaskError(TaskErrorCode.serverError, response.data.msg)
        return
      }
      const newPath = _.get(response.data.data, 'path')
      this.startFileUploadRequest(file, newPath)
    }).catch(error => { // 3. handler error
      console.log(error)
      if (_.get(error, 'message') === 'isCreated') {
        this.startFileUploadRequest(file)
        return
      }
      if (_.get(error, 'message') === 'cancel' || axios.isCancel(error)) return
      const code = error === FileHandleError.openError ? TaskErrorCode.openHandleError : TaskErrorCode.networkError
      this.handlerTaskError(code)
    })
  }
  private startFileUploadRequest (file: FileInfo, newPath?: string) {
    if (newPath !== undefined) file.destPath = newPath
    file.isCreated = true
    if (file.chunks === undefined) {
      this.endFileUpload(this.fileHandle, file)
      return
    }
    this.resetFileChunks(file)
    this.recursionFileChunk(this.fileHandle, file)
    this.recursionFileChunk(this.fileHandle, file)
    this.recursionFileChunk(this.fileHandle, file)
  }
  // 结束文件上传
  protected endFileUpload (fd: number, file: FileInfo) {
    if (this.buffer !== undefined) this.buffer = undefined
    FileHandle.closeFileHandle(fd).then(() => {
      this.fileHandle = -1
      return NasFileAPI.uploadMultipartEnd(file.destPath, this.uuid, file.md5!)
    }).then(response => {
      if (response.data.code !== 200) {
        this.handlerTaskError(TaskErrorCode.serverError, response.data.msg)
      } else {
        if (this.fileInfos.length > 1) this.emit('fileFinished', this.taskId)
        this.uploadFile()
      }
    }).catch(error => {
      console.log(error)
      const code = error === FileHandleError.closeError ? TaskErrorCode.closeHandleError : TaskErrorCode.networkError
      this.handlerTaskError(code)
    })
  }
  // 初始化文件分片集合
  private resetFileChunks (file: FileInfo) {
    file.chunks = file.chunks!.map(item => {
      item.isUploading = false
      item.errorCount = 0
      return item
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
  // 递归读取上传文件块
  private async recursionFileChunk (fd: number, file: FileInfo) {
    const chunk = this.getNextChunk(file.chunks!)
    if (chunk === undefined || this.status !== TaskStatus.progress) return
    this.readFileData(fd, chunk).then(bytes => {
      if (this.buffer === undefined) return Promise.reject(FileHandleError.readError)
      if (this.status !== TaskStatus.progress) return Promise.reject(new Error('cancel'))
      const buffer = this.buffer!.slice(0, bytes)
      const params = this.generateUploadParams(file, chunk)
      return NasFileAPI.uploadMultipartData(params, buffer, this.source)
    }).then(response => {
      if (this.status !== TaskStatus.progress) return
      if (response.data.code !== 200) {
        if (++chunk.errorCount <= this.retryCount) {
          this.recursionFileChunk(fd, file)
        } else {
          this.handlerTaskError(TaskErrorCode.networkError, response.data.msg)
        }
      } else {
        chunk.isCompleted = true
        this.completedBytes += chunk.length
        file.completedSize += chunk.length
        this.emit('progress', this.taskId)
        if (file.completedSize < file.totalSize) {
          this.recursionFileChunk(fd, file)
        } else {
          file.completed = true
          this.endFileUpload(fd, file)
        }
      }
    }).catch(error => {
      console.log(error)
      if (this.buffer !== undefined) this.buffer = undefined
      if (_.get(error, 'message') === 'cancel' || axios.isCancel(error)) return
      if (++chunk.errorCount <= this.retryCount) {
        this.recursionFileChunk(fd, file)
      } else {
        const code = error === FileHandleError.readError ? TaskErrorCode.readDataError : TaskErrorCode.networkError
        this.handlerTaskError(code)
      }
    })
  }
  // 获取下一个待上传的分片
  private getNextChunk (chunks: FileChunk[]) {
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index]
      if (chunk.isUploading !== true && chunk.isCompleted !== true) {
        chunk.isUploading = true
        return chunk
      }
    }
  }
  // 生成上传参数
  private generateUploadParams (fileInfo: FileInfo, chunk: FileChunk) {
    const params: UploadParams = {
      end: chunk.position + chunk.length - 1,
      uuid: this.uuid,
      path: fileInfo.destPath,
      start: chunk.position,
      size: chunk.length
    }
    if (fileInfo.isDirectory) params.dir = fileInfo.destDir
    return params
  }
  // 读取文件分片数据
  private readFileData (fd: number, chunk: FileChunk): Promise<number> {
    if (this.buffer === undefined) this.buffer = Buffer.alloc(this.maxChunkSize, 0, 'binary')
    return new Promise((resolve, reject) => {
      fs.read(fd, this.buffer!, 0, chunk.length, chunk.position, (error, bytes) => {
        if (error === null) {
          resolve(bytes)
        } else {
          console.log(error)
          reject(FileHandleError.readError)
        }
      })
    })
  }
  // protected methods
  // 过滤（备份加密用）
  protected filterFilesInfo (fileInfo: FileInfo): Promise<Boolean> {
    return Promise.resolve(false)
  }
}
