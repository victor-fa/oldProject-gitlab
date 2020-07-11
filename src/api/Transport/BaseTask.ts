// 传输任务基类
import _ from 'lodash'
import { EventEmitter } from 'events'
import StringUtility from '@/utils/StringUtility'

/** 传输任务事件
 * progress (taskId) 上传进度事件
 * fileBegin (taskId, fileInfo) 单个文件开始上传
 * fileFinished (taskId, fileInfo) 单个文件传输完成事件
 * taskSuspend (taskId) 任务挂起事件
 * taskResume (taskId) 任务继续事件
 * taskFinished (taskId) 任务完成事件
 * error (taskId, error) 任务出错事件
 */
export default class BaseTask extends EventEmitter {
  readonly srcPath: string
  readonly destPath: string
  readonly uuid: string
  readonly maxChunkSize = 1 * 1024 * 1024 // 单次读取的最大字节数
  type = '' // 任务类型，用于区分不同任务
  name: string // 文件名
  /**任务索引 */
  taskId: number = 0
  /**待传输总字节数 */
  countOfBytes: number = 0
  /**已传输完成字节数 */
  completedBytes: number = 0
  /**待传输文件对象集合 */
  fileInfos: FileInfo[] = []
  /**任务状态 */
  status = TaskStatus.pending
  /**传输速度 */
  speed = ''
  /**任务图标 */
  icon: any
  /**错误信息 */
  error?: TaskError

  constructor(srcPath: string, destPath: string, uuid: string) {
    super()
    this.srcPath = srcPath
    this.name = StringUtility.formatName(srcPath)
    this.destPath = destPath
    this.uuid = uuid
  }
  // public methods
  async start () {
    this.status = TaskStatus.progress
  }
  async cancel () {
    this.status = TaskStatus.error
    this.removeAllListeners()
  }
  suspend () {
    this.status = TaskStatus.suspend
  }
  resume () {
    this.status = TaskStatus.progress
  }
  reload () {
    this.status = TaskStatus.pending
    this.error = undefined
    this.removeAllListeners()
  }
  fullPath () {
    return `${this.destPath}/${this.name}`
  }
}

interface FileInfo {
  name: string,
  srcPath: string,
  destPath: string,
  relativePath: string,
  totalSize: number,
  completedSize: number,
  md5?: string,
  isDirectory: boolean,
  completed?: boolean,
  filter?: boolean
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
        return 'unkown error'
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
