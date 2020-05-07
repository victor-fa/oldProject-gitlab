// 传输队列，管理上传下载队列
import _ from 'lodash'
import { EventEmitter } from 'events'
import UploadTask, { UploadStatus, FileInfo, UploadError } from './UploadTask'
import { UPLOAD_QUEUE } from '@/common/constants'

/**
 * progress (task) 上传进度回调
 * fileFinished (task, fileInfo) 单个文件上传完成回调
 * taskFinished (task) 上传任务完成回调
 * error (task, error) 任务出错回调
*/
class UploadQueue extends EventEmitter {
  maxCount = 5 // 最大任务数
  private queue: UploadTask[] // 任务队列
  constructor () {
    super()
    this.queue = []
    // this.parseCache()
  }
  // upload methods
  /**获取全部任务 */
  getAllTasks () {
    return this.queue
  }
  /**添加新的任务 */
  addTask (task: UploadTask) {
    task.index = this.queue.length
    this.queue.push(task)
    this.cacheQueue()
    this.checkUploadQueue()
    this.emit('addTask', _.cloneDeep(task))
  }
  /**删除任务 */
  deleteTask (task: UploadTask) {
    task.cancel()
    this.queue = this.removeTask(task)
    this.cacheQueue()
    this.checkUploadQueue()
    this.emit('removeTask', _.cloneDeep(task))
  }
  /**刷新任务，当上传出错时，调用此接口刷新任务 */
  reloadTask (task: UploadTask) {
    const index = this.queue.indexOf(task)
    const newTask = new UploadTask(task.srcPath, task.destPath, task.uuid)
    newTask.index = task.index
    newTask.fileInfos = task.fileInfos
    this.queue.splice(index, 1, newTask)
    this.cacheQueue()
    this.checkUploadQueue()
  }
  // private methods
  // 检测队列并开始新的上传任务
  private checkUploadQueue () {
    const uploadingQueue = this.getUploadingQueue()
    if (uploadingQueue.length < this.maxCount) {
      for (let index = 0; index < this.queue.length; index++) {
        const task = this.queue[index]
        if (task.status === UploadStatus.pending) {
          task.start()
          this.observerTask(task)
          return
        }
      }
    }
  }
  // 获取正在上传中的任务队列
  private getUploadingQueue () {
    return this.queue.filter(item => {
      return item.status === UploadStatus.uploading
    })
  }
  // 监听上传任务的回调
  private observerTask (task: UploadTask) {
    task.on('progress', (index: number) => {
      this.handleTaskProcess(index)
    })
    task.on('fileFinished', (index: number, fileInfo: FileInfo) => {
      this.handleFileFinished(index, fileInfo)
    })
    task.once('taskFinished', (index: number) => {
      this.handleTaskFinished(index)
    })
    task.once('error', (index: number, error: UploadError) => {
      this.handleTaskError(index, error)
    })
  }
  // 移除task,并更新其它任务的标识符
  private removeTask (task: UploadTask) {
    const index = task.index
    return this.queue.filter((task, aIndex) => {
      if (aIndex === index) return false
      if (aIndex > index) task.index = aIndex - 1
      return true
    })
  }
  // 上传任务状态改变就同步到本地缓存
  private cacheQueue () {
    // TODO： 任务队列应该使用数据库缓存，目前使用localStorage缓存，性能很差
    // if (this.queue.length === 0) return Promise.resolve()
    // return new Promise((resolve) => {
    //   if (_.isEmpty(this.queue)) {
    //     localStorage.removeItem(UPLOAD_QUEUE)
    //     resolve()
    //     return
    //   }
    //   const json = JSON.stringify(this.queue)
    //   localStorage.setItem(UPLOAD_QUEUE, json)
    //   resolve()
    // })
  }
  // 解析并添加缓存的队列
  private parseCache () {
    const json = localStorage.getItem(UPLOAD_QUEUE)
    if (json === null) return
    const queue = JSON.parse(json) as UploadTask[]
    this.queue = queue.map(item => {
      const newTask = new UploadTask(item.srcPath, item.destPath, item.uuid)
      newTask.index = item.index
      newTask.status = item.status
      newTask.fileInfos = item.fileInfos
      newTask.countOfBytes = item.countOfBytes
      newTask.uploadedBytes = item.uploadedBytes
      return newTask
    })
  }
  // protected methods
  // handle upload task callback
  protected handleTaskProcess (index: number) {
    const task = this.queue[index]
    this.emit('progress', _.cloneDeep(task))
  }
  protected handleFileFinished (index: number, fileInfo: FileInfo) {
    const task = this.queue[index]
    this.emit('fileFinished', _.cloneDeep(task), fileInfo)
    this.cacheQueue()
  }
  protected handleTaskFinished (index: number) {
    const task = this.queue[index]
    this.checkUploadQueue()
    task.removeAllListeners()
    this.emit('taskFinished', _.cloneDeep(task))
  }
  protected handleTaskError (index: number, error: UploadError) {
    const task = this.queue[index]
    task.removeAllListeners()
    this.emit('error', _.cloneDeep(task), error)
  }
}

const uploadQueue = new UploadQueue()

export {
  UploadQueue,
  uploadQueue
}
