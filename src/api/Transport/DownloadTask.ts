// 下载任务类，支持断点下载
import _ from 'lodash'
import NasFileAPI from '../NasFileAPI'
import FileHandle, { FileHandleError, downloadingSuffix } from '@/utils/FileHandle'
import axios, { AxiosResponse, CancelTokenSource } from 'axios'
import { DownloadParams, ResourceItem, ResourceType } from '../NasFileModel'
import BaseTask, { TaskStatus, TaskError, TaskErrorCode, FileInfo } from './BaseTask'
import path from 'path'
import StringUtility from '@/utils/StringUtility'
import ResourceHandler from '@/views/MainView/ResourceHandler'

export default class DownloadTask extends BaseTask {
  readonly maxDownloadSize = 1 * 1024 * 1024 // 单次最大下载字节数
  source?: CancelTokenSource // 下载取消请求标识
  private fileHandle = -1 // 文件句柄
  private resourceItem?: ResourceItem
  private fileCount = 0
  private previousSize = 0
  private speedTimer?: NodeJS.Timeout

  constructor(srcPath: string, destPath: string, uuid: string) {
    super(srcPath, destPath, uuid)
    const CancelToken = axios.CancelToken
    this.source = CancelToken.source()
    this.type = 'download'
  }
  // public methods
  setResourceItem (item: ResourceItem) {
    this.resourceItem = item
    this.icon = ResourceHandler.searchResourceIcon(item.type, item.path)
  }
  async start () {
    super.start()
    // 1. 转换需要下载的文件对象
    if (this.resourceItem !== undefined) {
      await this.fetchFileInfos(this.resourceItem)
    }
    // 2. 计算总文件大小
    this.calculateDownloadSize()
    // 3. 开始递归下载
    this.downloadFile()
    // 4. 开启速度定时器
    this.beginSpeedTimer()
  }
  async cancel () {
    super.cancel()
    if (this.fileHandle !== -1) {
      FileHandle.closeFileHandle(this.fileHandle)
      this.fileHandle = -1
    }
    if (this.source !== undefined) {
      this.source.cancel()
      this.source = undefined
    }
    this.fileInfos = []
    // let filePath = this.fullPath()
    // if (this.status !== TaskStatus.finished) filePath += downloadingSuffix
    // console.log(this.status)
    // console.log(filePath)
    // await FileHandle.removeFile(filePath)
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
    const CancelToken = axios.CancelToken
    this.source = CancelToken.source()
    this.downloadFile()
  }
  reload () {
    super.reload()
    const CancelToken = axios.CancelToken
    this.source = CancelToken.source()
  }
  // private methods
  // 获取待下载的文件
  private fetchFileInfos (item: ResourceItem): Promise<void> {
    return new Promise(resolve => {
      const fileInfo = this.convertFileInfo(item)
      this.fileInfos = [fileInfo]
      if (item.type !== ResourceType.folder) {
        resolve()
      } else {
        this.recursionFetchTree(1, error => {
          if (error !== undefined) {
            this.handleDownloadError(error.code, error.desc)
          }
          resolve()
        })
      }
    })
  }
  // 递归获取文件树
  recursionFetchTree (page: number, completionHandler: (error?: TaskError) => void) {
    NasFileAPI.fetchFileTree(this.srcPath, this.uuid, page).then(response => {
      if (response.data.code !== 200) {
        const error = new TaskError(TaskErrorCode.serverError, response.data.msg)
        completionHandler(error)
      } else {
        this.fileCount = _.get(response.data.data, 'total')
        const list = _.get(response.data.data, 'list') as ResourceItem[]
        if (_.isEmpty(list)) {
          completionHandler()
          return
        }
        const fileInfos = list.map(item => {
          return this.convertFileInfo(item)
        })
        this.fileInfos = page === 1 ? fileInfos : this.fileInfos.concat(fileInfos)
        if (this.fileInfos.length >= this.fileCount) {
          completionHandler()
        } else {
          this.recursionFetchTree(page + 1, completionHandler)
        }
      }
    }).catch(_ => {
      const error = new TaskError(TaskErrorCode.networkError)
      completionHandler(error)
    })
  }
  // 将资源对象转换成文件对象
  private convertFileInfo (item: ResourceItem) {
    const name = StringUtility.formatName(item.path)
    let destPath = `${this.destPath}/${name}`
    let relativePath = name
    if (this.resourceItem!.type === ResourceType.folder) {
      const directory = path.dirname(this.resourceItem!.path)
      relativePath = item.path.substring(directory.length, item.path.length)
      destPath = `${this.destPath}${relativePath}`
    }
    const fileInfo: FileInfo = {
      name,
      relativePath,
      destPath,
      srcPath: item.path,
      totalSize: item.size,
      completedSize: 0,
      isDirectory: item.type === ResourceType.folder
    }
    return fileInfo
  }
  // 计算下载任务总大小
  private calculateDownloadSize () {
    this.countOfBytes = 0
    this.completedBytes = 0
    this.fileInfos.forEach(item => {
      this.countOfBytes += item.totalSize
      this.completedBytes += item.completedSize
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
  // 递归下载文件
  private downloadFile () {
    if (this.status !== TaskStatus.progress) return
    const fileInfo = this.getNextFileInfo()
    if (fileInfo === null) {
      this.status = TaskStatus.finished
      this.name = path.basename(this.srcPath)
      this.emit('taskFinished', this.taskId)
      this.clearSpeedTimer()
      return
    }
    if (fileInfo.isDirectory === true) {
      this.createDirectory(fileInfo)
    } else {
      this.startDownloadFile(fileInfo)
    }
  }
  // 创建目录
  private createDirectory (fileInfo: FileInfo) {
    this.name = fileInfo.relativePath
    if (this.fileInfos.length > 1) this.emit('fileBegin', this.taskId, fileInfo)
    FileHandle.newDirectory(fileInfo.destPath).then(() => {
      fileInfo.completed = true
      if (this.fileInfos.length > 1) this.emit('fileFinished', this.taskId, _.cloneDeep(fileInfo))
      this.downloadFile()
    }).catch(_ => {
      fileInfo.completed = true
      this.downloadFile()
    })
  }
  // 开始文件下载
  private startDownloadFile (fileInfo: FileInfo) {
    this.name = fileInfo.relativePath
    if (this.fileInfos.length > 1) this.emit('fileBegin', this.taskId, fileInfo)
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
      if (this.fileInfos.length > 1) this.emit('fileFinished', this.taskId, _.cloneDeep(fileInfo))
      this.downloadFile()
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
  private getNextFileInfo () {
    for (let index = 0; index < this.fileInfos!.length; index++) {
      const item = this.fileInfos[index]
      if (item.filter === true) continue
      if (item.completed === true) continue
      return item
    }
    return null
  }
  // 递归下载单个文件
  private downloadSingleFile (fd: number, fileInfo: FileInfo): Promise<number> {
    return new Promise((resolve, reject) => {
      this.downloadFileChunk(fd, fileInfo, (bytes: number, error?: TaskError) => {
        if (!_.isEmpty(error)) {
          reject(error)
        } else {
          this.completedBytes += bytes
          this.emit('progress', this.taskId)
          const isCompleted = fileInfo.completedSize >= fileInfo.totalSize || fileInfo.totalSize === 0
          fileInfo.completed = isCompleted
          isCompleted && resolve(fd)
        }
      })
    })
  }
  // 下载并写入文件数据
  protected downloadFileChunk (fd: number, fileInfo: FileInfo, completionHandler: (bytes: number, error?: TaskError) => void) {
    let chunkLength = 0
    this.downloadChunkData(fileInfo).then(response => { // download data
      if (response.status !== 200 && response.status !== 206) {
        const error = new TaskError(TaskErrorCode.serverError, response.statusText)
        return Promise.reject(error)
      }
      const result = this.parseResponse(response)
      if (result === null) {
        if (this.resourceItem!.type === ResourceType.folder) {
          return FileHandle.newDirectory(fileInfo.destPath)
        } else {
          return FileHandle.newFile(fileInfo.destPath)
        }
      }
      fileInfo.completedSize += result.bytes
      chunkLength = result.bytes
      return FileHandle.wirteFile(fd, result.buffer)
    }).then(() => { // write data
      if (this.status !== TaskStatus.progress) return
      completionHandler(chunkLength)
      if (fileInfo.completedSize < fileInfo.totalSize) this.downloadFileChunk(fd, fileInfo, completionHandler)
    }).catch(error => { // catch error
      if (this.status !== TaskStatus.progress || axios.isCancel(error)) return
      if (_.isNumber(error)) {
        const error = new TaskError(TaskErrorCode.writeDataError)
        completionHandler(0, error)
      } else {
        const error = new TaskError(TaskErrorCode.networkError)
        completionHandler(0, error)
      }
    })
  }
  // 生成下载请求参数
  protected generateDownloadParams (fileInfo: FileInfo): DownloadParams {
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
  private handleDownloadError (code: TaskErrorCode, desc?: string) {
    const error = new TaskError(code, desc)
    this.status = TaskStatus.error
    this.speed = ''
    this.error = error
    this.emit('error', this.taskId, error)
    this.clearSpeedTimer()
  }
  // protected methods
  protected downloadChunkData (fileInfo: FileInfo, source?: CancelTokenSource) {
    const params = this.generateDownloadParams(fileInfo)
    return NasFileAPI.downloadData(params, this.source)
  }
}
