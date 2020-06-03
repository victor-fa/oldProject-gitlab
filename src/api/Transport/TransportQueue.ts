// 传输队列，管理上传下载队列
import _ from 'lodash'
import { EventEmitter } from 'events'
import BaseTask, { TaskStatus, FileInfo, TaskError } from './BaseTask'
import UploadTask from './UploadTask'
import BackupUploadTask from './BackupUploadTask'
import EncryptUploadTask from './EncryptUploadTask'
import DownloadTask from './DownloadTask'
import EncryptDownloadTask from './EncryptDownloadTask'

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
    this.openTransportDB().then(event => {
      this.readDBTasks(event)
    }).catch(error => {
      console.log(error)
    })
  }
  // public methods
  /**获取全部任务 */
  getAllTasks () {
    return this.queue
  }
  /**添加新的任务 */
  addTask (task: T) {
    task.index = this.generateTaskIndex()
    this.queue.push(task)
    this.checkUploadQueue()
    this.emit('addTask', _.cloneDeep(task))
    if (this.db !== undefined) {
      const obj = this.convertTask2Obj(task)
      this.db.transaction([this.tableName], 'readwrite').objectStore(this.tableName).add(obj)
    }
  }
  /**删除任务 */
  deleteTask (task: T) {
    task.cancel()
    this.queue = this.removeTask(task)
    this.checkUploadQueue()
    this.emit('removeTask', _.cloneDeep(task))
    if (this.db !== undefined) {
      this.db.transaction([this.tableName], 'readwrite').objectStore(this.tableName).delete(task.index)
    }
  }
  /**刷新任务，当上传出错时，调用此接口刷新任务 */
  reloadTask (task: T) {
    const index = this.queue.indexOf(task)
    task.reload()
    this.queue.splice(index, 1, task)
    this.checkUploadQueue()
    this.reloadTaskInDB(task)
  }
  /**清除所有任务 */
  clearAllTask () {
    this.queue.forEach(task => {
      if (task.status === TaskStatus.progress) task.cancel()
    })
    this.queue = []
    this.clearTable(this.db)
  }
  // private methods
  private generateTaskIndex () {
    const task = _.last(this.queue)
    if (task === undefined) return 0
    return task.index + 1
  }
  private openTransportDB (): Promise<Event> {
    return new Promise((resolve, reject) => {
      const packageJson = require('../../../package.json')
      const version = packageJson.version as string
      let versionNum = 0
      version.split('.').reverse().forEach((value, index) => {
        const pow = Math.pow(10, index * 2)
        versionNum += Number(value) * pow
      })
      const request = window.indexedDB.open('nas_transport', versionNum)
      request.onupgradeneeded = event => {
        const target = event.target as IDBOpenDBRequest
        const db = target.result
        this.createTable(db, 'UploadQueue')
        this.createTable(db, 'BackupQueue')
        this.createTable(db, 'EncryptQueue')
        this.createTable(db, 'DownloadQueue')
        this.createTable(db, 'EncryptDownloadQueue')
      }
      request.onsuccess = event => {
        resolve(event)
      }
      request.onerror = event => {
        reject(event)
      }
    })
  }
  private createTable (db: IDBDatabase, name: string) {
    if (!db.objectStoreNames.contains(name)) {
      db.createObjectStore(name, { keyPath: 'index' })
    }
  }
  private clearTable (db?: IDBDatabase) {
    if (db === undefined) return
    if (db.objectStoreNames.contains(this.tableName)) {
      const objectStore = db.transaction(this.tableName, 'readwrite').objectStore(this.tableName)
      objectStore.clear()
    }
  }
  private readDBTasks (event: Event) {
    const db = (event.target as IDBOpenDBRequest).result
    this.db = db
    if (db.objectStoreNames.length > 0) {
      const objectStore = this.db.transaction(this.tableName, 'readonly').objectStore(this.tableName)
      objectStore.openCursor().onsuccess = event => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue
        if (cursor !== null) {
          const task = this.convertObj2Task(cursor.value)
          this.queue.push(task)
          cursor.continue()
        }
      }
    }
  }
  // 将task转换成DB可以存储的对象
  private convertTask2Obj (task: T) {
    return {
      srcPath: task.srcPath,
      destPath: task.destPath,
      uuid: task.uuid,
      index: task.index,
      countOfBytes: task.countOfBytes,
      completedBytes: task.completedBytes,
      fileInfos: task.fileInfos,
      status: task.status
    }
  }
  // 将DB中存储的对象转换成task
  private convertObj2Task (obj: any) {
    const task = this.createTask(obj.srcPath, obj.destPath, obj.uuid)
    task.index = obj.index
    task.countOfBytes = obj.countOfBytes
    task.completedBytes = obj.completedBytes
    task.fileInfos = obj.fileInfos
    task.status = obj.status
    return task as T
  }
  private createTask (srcPath: string, destPath: string, uuid: string) {
    if (this.tableName === 'UploadQueue') {
      return new UploadTask(srcPath, destPath, uuid)
    } else if (this.tableName === 'BackupQueue') {
      return new BackupUploadTask(srcPath, destPath, uuid)
    } else if (this.tableName === 'EncryptQueue') {
      return new EncryptUploadTask(srcPath, destPath, uuid)
    } else if (this.tableName === 'DownloadQueue') {
      return new DownloadTask(srcPath, destPath, uuid)
    } else if (this.tableName === 'EncryptDownloadQueue') {
      return new EncryptDownloadTask(srcPath, destPath, uuid)
    }
    return new BaseTask(srcPath, destPath, uuid)
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
  private reloadTaskInDB (task: T) {
    if (this.db !== undefined) {
      const obj = this.convertTask2Obj(task)
      this.db.transaction([this.tableName], 'readwrite').objectStore(this.tableName).put(obj)
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
    const newTask = _.cloneDeep(task)
    this.reloadTaskInDB(newTask)
    this.emit('fileFinished', newTask, fileInfo)
  }
  protected handleTaskFinished (index: number) {
    const task = this.searchTask(index)
    if (task === undefined) return
    this.checkUploadQueue()
    task.removeAllListeners()
    const newTask = _.cloneDeep(task)
    this.reloadTaskInDB(newTask)
    this.emit('taskFinished', newTask)
  }
  protected handleTaskError (index: number, error: TaskError) {
    const task = this.searchTask(index)
    if (task === undefined) return
    task.removeAllListeners()
    const newTask = _.cloneDeep(task)
    this.reloadTaskInDB(newTask)
    this.emit('error', newTask, error)
  }
}

let uploadQueue: TaskQueue<UploadTask>
let backupUploadQueue: TaskQueue<BackupUploadTask>
let encryptUploadQueue: TaskQueue<EncryptUploadTask>
let downloadQueue: TaskQueue<DownloadTask>
let encryptDownloadQueue: TaskQueue<EncryptDownloadTask>

/**初始化传输队列 */
const initQueue = () => {
  removeQueueListeners(uploadQueue)
  uploadQueue = new TaskQueue<UploadTask>('UploadQueue')
  removeQueueListeners(backupUploadQueue)
  backupUploadQueue = new TaskQueue<BackupUploadTask>('BackupQueue')
  removeQueueListeners(encryptUploadQueue)
  encryptUploadQueue = new TaskQueue<EncryptUploadTask>('EncryptQueue')
  removeQueueListeners(downloadQueue)
  downloadQueue = new TaskQueue<DownloadTask>('DownloadQueue')
  removeQueueListeners(encryptDownloadQueue)
  encryptDownloadQueue = new TaskQueue<EncryptDownloadTask>('EncryptDownloadQueue')
}

/**清理传输队列缓存 */
const clearQueueCache = () => {
  releaseQueue(uploadQueue)
  releaseQueue(backupUploadQueue)
  releaseQueue(encryptUploadQueue)
  releaseQueue(downloadQueue)
  releaseQueue(encryptDownloadQueue)
}

const releaseQueue = <T extends BaseTask>(queue?: TaskQueue<T>) => {
  removeQueueListeners(queue)
  if (queue !== undefined) {
    queue.clearAllTask()
    queue = undefined
  }
}

const removeQueueListeners = <T extends BaseTask>(queue?: TaskQueue<T>) => {
  if (queue !== undefined) {
    const tasks = queue.getAllTasks()
    tasks.forEach(task => {
      task.removeAllListeners()
    })
    queue.removeAllListeners()
  }
}

export {
  TaskQueue,
  uploadQueue,
  backupUploadQueue,
  encryptUploadQueue,
  downloadQueue,
  encryptDownloadQueue,
  initQueue,
  clearQueueCache
}
