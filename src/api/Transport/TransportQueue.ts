// 传输队列，管理上传下载队列
import _ from 'lodash'
import { EventEmitter } from 'events'
import BaseTask, { TaskStatus, FileInfo, TaskError } from './BaseTask'
import UploadTask from './UploadTask'
import BackupUploadTask from './BackupUploadTask'
import EncryptUploadTask from './EncryptUploadTask'
import DownloadTask from './DownloadTask'

/**
 * progress (task) 上传进度回调
 * fileFinished (task, fileInfo) 单个文件上传完成回调
 * taskFinished (task) 上传任务完成回调
 * error (task, error) 任务出错回调
*/
class TaskQueue<T extends BaseTask> extends EventEmitter {
  /**最大任务数 */
  maxCount = 5
  private queue: T[]
  private tableName: string
  private db?: IDBDatabase
  constructor (tableName: string) {
    super()
    this.tableName = tableName
    this.queue = []
    this.readDBTasks()
  }
  // public methods
  /**获取全部任务 */
  getAllTasks () {
    return this.queue
  }
  /**添加新的任务 */
  addTask (task: T) {
    task.index = this.queue.length
    this.queue.push(task)
    this.checkUploadQueue()
    this.emit('addTask', _.cloneDeep(task))
    // if (this.db !== undefined) {
    //   this.db.transaction([this.tableName], 'readwrite').objectStore(this.tableName).add(task)
    // }
  }
  /**删除任务 */
  deleteTask (task: T) {
    task.cancel()
    this.queue = this.removeTask(task)
    this.checkUploadQueue()
    this.emit('removeTask', _.cloneDeep(task))
    // if (this.db !== undefined) {
    //   this.db.transaction([this.tableName], 'readwrite').objectStore(this.tableName).delete(task.index)
    // }
  }
  /**刷新任务，当上传出错时，调用此接口刷新任务 */
  reloadTask (task: T) {
    const index = this.queue.indexOf(task)
    const newTask = new BaseTask(task.srcPath, task.destPath, task.uuid) as T
    newTask.index = task.index
    newTask.fileInfos = task.fileInfos
    this.queue.splice(index, 1, newTask)
    this.checkUploadQueue()
    // this.reloadTaskInDB(newTask)
  }
  // private methods
  private readDBTasks () {
    const request = window.indexedDB.open('nas_client')
    request.onupgradeneeded = event => {
      const target = event.target as IDBOpenDBRequest
      const db = target.result
      if (db.objectStoreNames.contains(this.tableName)) {
        db.createObjectStore(this.tableName, { keyPath: 'index' })
      }
    }
    request.onsuccess = event => {
      const db = (event.target as IDBOpenDBRequest).result
      this.db = db
      if (db.objectStoreNames.length > 0) {
        const objectStore = this.db.transaction(this.tableName, 'readonly').objectStore(this.tableName)
        objectStore.openCursor().onsuccess = event => {
          const cursor = (event.target as IDBRequest).result
          if (_.isEmpty(cursor)) return
          this.queue.push(cursor as T)
        }
      }
    }
  }
  // 检测队列并开始新的上传任务
  private checkUploadQueue () {
    const uploadingQueue = this.getUploadingQueue()
    if (uploadingQueue.length < this.maxCount) {
      for (let index = 0; index < this.queue.length; index++) {
        const task = this.queue[index]
        if (task.status === TaskStatus.pending) {
          task.start()
          this.observerTask(task)
          return
        }
      }
    }
  }
  reloadTaskInDB (task: T) {
    if (this.db !== undefined) {
      this.db.transaction([this.tableName], 'readwrite').objectStore(this.tableName).put(task)
    }
  }
  // 获取正在上传中的任务队列
  private getUploadingQueue () {
    return this.queue.filter(item => {
      return item.status === TaskStatus.progress
    })
  }
  // 监听上传任务的回调
  private observerTask (task: T) {
    task.on('progress', (index: number) => {
      this.handleTaskProcess(index)
    })
    task.on('fileFinished', (index: number, fileInfo: FileInfo) => {
      this.handleFileFinished(index, fileInfo)
    })
    task.once('taskFinished', (index: number) => {
      this.handleTaskFinished(index)
    })
    task.once('error', (index: number, error: TaskError) => {
      this.handleTaskError(index, error)
    })
  }
  // 移除task,并更新其它任务的标识符
  private removeTask (task: T) {
    const index = task.index
    return this.queue.filter((task, aIndex) => {
      if (aIndex === index) return false
      if (aIndex > index) task.index = aIndex - 1
      return true
    })
  }
  searchTask (aIndex: number) {
    for (let index = 0; index < this.queue.length; index++) {
      const task = this.queue[index]
      if (task.index === aIndex) return task
    }
  }
  // protected methods
  // handle upload task callback
  protected handleTaskProcess (index: number) {
    const task = this.searchTask(index)
    if (task === undefined) return
    this.emit('progress', _.cloneDeep(task))
  }
  protected handleFileFinished (index: number, fileInfo: FileInfo) {
    const task = this.searchTask(index)
    if (task === undefined) return
    this.emit('fileFinished', _.cloneDeep(task), fileInfo)
    // this.reloadTaskInDB(task)
  }
  protected handleTaskFinished (index: number) {
    const task = this.searchTask(index)
    if (task === undefined) return
    this.checkUploadQueue()
    task.removeAllListeners()
    this.emit('taskFinished', _.cloneDeep(task))
    // this.reloadTaskInDB(task)
  }
  protected handleTaskError (index: number, error: TaskError) {
    const task = this.searchTask(index)
    if (task === undefined) return
    task.removeAllListeners()
    this.emit('error', _.cloneDeep(task), error)
    // this.reloadTaskInDB(task)
  }
}

const uploadQueue = new TaskQueue<UploadTask>('UploadQueue')
const backupUploadQueue = new TaskQueue<BackupUploadTask>('BaskupQueue')
const encryptUploadQueue = new TaskQueue<EncryptUploadTask>('EncryptQueue')
const downloadQueue = new TaskQueue<DownloadTask>('DownloadQueue')

export {
  TaskQueue,
  uploadQueue,
  backupUploadQueue,
  encryptUploadQueue,
  downloadQueue
}
