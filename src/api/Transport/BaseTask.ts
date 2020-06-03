// 上传工具类，支持目录和文件上传、断点续传
import { EventEmitter } from 'events'
import StringUtility from '@/utils/StringUtility'

/** 目前只支持下载文件，不支持文件夹下载
 * progress (index) 上传进度回调
 * fileFinished (index, fileInfo) 单个文件下载完成
 * taskFinished (index) 下载任务完成
 * error (index, error) 任务出错回调
 */
export default class BaseTask extends EventEmitter {
  readonly srcPath: string
  readonly destPath: string
  readonly uuid: string
  readonly name: string // 文件名
  readonly maxChunkSize = 1 * 1024 * 1024 // 单次读取的最大字节数
  /**任务索引 */
  index: number = 0
  /**待传输总字节数 */
  countOfBytes: number = 0
  /**已传输完成字节数 */
  completedBytes: number = 0
  /**待传输文件对象集合 */
  fileInfos: FileInfo[] = []
  /**任务状态 */
  status = TaskStatus.pending

  constructor(srcPath: string, destPath: string, uuid: string) {
    super()
    this.srcPath = srcPath
    this.destPath = destPath
    this.uuid = uuid
    this.name = StringUtility.formatName(srcPath)
  }
  // public methods
  async start () {
    this.status = TaskStatus.progress
  }
  cancel () {
    this.status = TaskStatus.error
  }
  suspend () {
    this.status = TaskStatus.suspend
  }
  resume () {
    this.status = TaskStatus.progress
  }
  reload () {
    this.status = TaskStatus.pending
  }
}

interface FileInfo {
  name: string,
  srcPath: string,
  destPath: string,
  totalSize: number,
  completedSize: number,
  md5?: string,
  isDirectory?: boolean,
  relativePath?: string,
  newCompleted?: boolean
}

enum TaskStatus {
  pending,
  progress,
  suspend,
  finished,
  error
}

class TaskError {
  code: TaskErrorCode
  desc: string
  constructor (code: number, desc?: string) {
    this.code = code
    this.desc = desc === undefined ? this.matchNormalErrorDesc(code) : desc
  }
  matchNormalErrorDesc (code: TaskErrorCode) {
    switch (code) {
      case TaskErrorCode.openHandleError:
        return 'open file handle error'
      case TaskErrorCode.closeHandleError:
        return 'close file handle error'
      case TaskErrorCode.readStatError:
        return 'read file stat error'
      case TaskErrorCode.readDataError:
        return 'read file data error'
      case TaskErrorCode.writeDataError:
        return 'write file data error'
      case TaskErrorCode.serverError:
        return 'nas server inner error'
      case TaskErrorCode.networkError:
        return 'network error'
      case TaskErrorCode.pathError:
        return 'upload file directory is empty'
      default:
        return 'unkown'
    }
  }
}

enum TaskErrorCode {
  unkown,
  openHandleError,
  closeHandleError,
  readStatError,
  readDataError,
  writeDataError,
  networkError,
  serverError,
  pathError
}

export {
  FileInfo,
  TaskStatus,
  TaskError,
  TaskErrorCode
}
