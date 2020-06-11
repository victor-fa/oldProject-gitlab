// 传输任务基类
import _ from 'lodash'
import { EventEmitter } from 'events'
import StringUtility from '@/utils/StringUtility'
import { ResourceItem } from '../NasFileModel'

/** 传输任务事件
 * progress (index) 上传进度事件
 * fileFinished (index, fileInfo) 单个文件传输完成事件
 * taskFinished (index) 任务完成事件
 * error (index, error) 任务出错事件
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

  constructor(item: string | ResourceItem, destPath: string, uuid: string) {
    super()
    if (_.isString(item)) {
      this.srcPath = item
      this.name = StringUtility.formatName(item)
    } else {
      this.srcPath = (item as ResourceItem).path
      this.name = (item as ResourceItem).name
    }
    this.destPath = destPath
    this.uuid = uuid
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
  newCompleted?: boolean,
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
