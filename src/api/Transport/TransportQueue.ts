// 传输队列，管理上传下载队列
import _, { reject } from 'lodash'
import { EventEmitter } from 'events'
import BaseTask, { TaskStatus, FileInfo, TaskError } from './BaseTask'
import UploadTask from './UploadTask'
import BackupUploadTask from './BackupUploadTask'
import EncryptUploadTask from './EncryptUploadTask'
import DownloadTask from './DownloadTask'
import EncryptDownloadTask from './EncryptDownloadTask'
import store from '@/store'
import { User } from '../UserModel'
import { NasInfo } from '../ClientModel'

/**
 * taskStatusChange (taskId) 任务状态改变事件
 * taskQueueChange () 任务队列数量改变
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
    task.taskId = this.generateTaskId()
    this.queue.push(task)
    if (this.db !== undefined) {
      const obj = this.convertTask2Obj(task)
      this.db.transaction([this.tableName], 'readwrite').objectStore(this.tableName).add(obj)
    }
    this.emit('taskQueueChange')
    this.checkUploadQueue()
  }
  /**删除任务 */
  async deleteTask (task: T) {
    await task.cancel()
    this.queue = this.removeTask(task.taskId)
    this.emit('taskQueueChange')
    await this.deleteTaskInDB(task)
    this.checkUploadQueue()
  }
  /**刷新任务，当上传出错时，调用此接口刷新任务 */
  async reloadTask (task: T) {
    task.reload()
    this.queue = this.updateQueue(task)
    this.emit('taskStatusChange', task.taskId)
    this.reloadTaskInDB(task)
    this.checkUploadQueue()
  }
  /**暂停任务 */
  async suspendTask (task: T) {
    task.suspend()
    this.queue = this.updateQueue(task)
    this.emit('taskStatusChange', task.taskId)
    this.reloadTaskInDB(task)
    this.checkUploadQueue()
  }
  /**继续任务 */
  async resumeTask (task: T) {
    task.resume()
    this.queue = this.updateQueue(task)
    this.emit('taskStatusChange', task.taskId)
    this.reloadTaskInDB(task)
    this.checkUploadQueue()
  }
  /**删除进行中的任务 */
  deleteDoingTasks () {
    this.queue.forEach(task => {
      if (task.status !== TaskStatus.finished) {
        task.cancel()
        this.deleteTask(task)
      }
    })
    this.emit('taskQueueChange')
  }
  /**删除已完成的任务 */
  deleteDoneTasks () {
    this.queue.forEach(task => {
      if (task.status === TaskStatus.finished) {
        task.cancel()
        this.deleteTask(task)
      }
    })
    this.emit('taskQueueChange')
  }
  /**暂停全部任务 */
  suspendAllTasks () {
    this.queue.forEach(task => {
      if (task.status === TaskStatus.pending || task.status === TaskStatus.progress) {
        task.suspend()
        this.reloadTaskInDB(task)
      }
    })
    this.emit('taskQueueChange')
  }
  /**批量继续 */
  resumeAllTasks () {
    this.queue.forEach(task => {
      if (task.status === TaskStatus.suspend) {
        task.completedBytes > 0 ? task.resume() : task.reload()
        this.reloadTaskInDB(task)
      }
    })
    this.emit('taskQueueChange')
  }
  /**查找任务 */
  searchTask (taskId: number) {
    for (let index = 0; index < this.queue.length; index++) {
      const task = this.queue[index]
      if (task.taskId === taskId) return task
    }
  }
  /**清空任务队列 */
  clearAllTask () {
    this.queue.forEach(task => {
      task.cancel()
    })
    this.queue = []
    this.clearTable(this.db)
  }
  // private methods
  private generateTaskId () {
    const task = _.last(this.queue)
    if (task === undefined) return 0
    return task.taskId + 1
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
    const fullName = this.genterateFullTableName(name)
    if (!db.objectStoreNames.contains(fullName)) {
      db.createObjectStore(fullName, { keyPath: 'index' })
    }
  }
  private genterateFullTableName (name: string) {
    const ugreenNo = (_.get(store.getters, 'User/user') as User).ugreenNo
    const sn = (_.get(store.getters, 'NasServer/nasInfo') as NasInfo).sn
    return `${ugreenNo}-${sn}-${name}`
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
      index: task.taskId,
      countOfBytes: task.countOfBytes,
      completedBytes: task.completedBytes,
      fileInfos: task.fileInfos,
      status: task.status,
      type: task.icon
    }
  }
  // 将DB中存储的对象转换成task
  private convertObj2Task (obj: any) {
    const task = this.createTask(obj.srcPath, obj.destPath, obj.uuid)
    task.taskId = obj.index
    task.countOfBytes = obj.countOfBytes
    task.completedBytes = obj.completedBytes
    task.fileInfos = obj.fileInfos
    task.status = obj.status
    task.icon = obj.icon
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
  private reloadTaskInDB (task: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db !== undefined) {
        const obj = this.convertTask2Obj(task)
        const request = this.db.transaction([this.tableName], 'readwrite').objectStore(this.tableName).put(obj)
        request.onerror = event => {
          reject(event)
        }
        request.onsuccess = _ => {
          resolve()
        }
      }
      resolve()
    })
  }
  private deleteTaskInDB (task: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db !== undefined) {
        const request = this.db.transaction([this.tableName], 'readwrite').objectStore(this.tableName).delete(task.taskId)
        request.onerror = event => {
          reject(event)
        }
        request.onsuccess = _ => {
          resolve()
        }
      }
      resolve()
    })
  }
  // 获取正在上传中的任务队列
  private getUploadingQueue () {
    return this.queue.filter(item => {
      return item.status === TaskStatus.progress
    })
  }
  // 移除task,并更新其它任务的标识符
  private removeTask (taskId: number) {
    return this.queue.filter(task => {
      return taskId !== task.taskId
    })
  }
  // 更新任务
  private updateQueue (task: T) {
    return this.queue.map(item => {
      if (item.taskId === task.taskId) return task
      return item
    })
  }
  // 监听上传任务的回调
  private observerTask (task: T) {
    task.addListener('progress', (index: number) => {
      this.handleTaskProcess(index)
    })
    task.addListener('fileFinished', (index: number, fileInfo: FileInfo) => {
      this.handleFileFinished(index, fileInfo)
    })
    task.addListener('taskFinished', (index: number) => {
      this.handleTaskFinished(index)
    })
    task.addListener('error', (index: number, error: TaskError) => {
      this.handleTaskError(index, error)
    })
  }
  // protected methods
  // handle upload task callback
  protected handleTaskProcess (index: number) {
    this.emit('taskStatusChange', index)
  }
  protected handleFileFinished (index: number, fileInfo: FileInfo) {
    console.log(fileInfo)
    const task = this.searchTask(index)
    if (task === undefined) return
    const newTask = _.cloneDeep(task)
    this.reloadTaskInDB(newTask)
    this.emit('taskStatusChange', task.taskId)
  }
  protected handleTaskFinished (index: number) {
    const task = this.searchTask(index)
    if (task === undefined) return
    this.reloadTaskInDB(task)
    this.checkUploadQueue()
    this.emit('taskStatusChange', task.taskId)
    this.emit('taskFinished')
    task.removeAllListeners()
  }
  protected handleTaskError (index: number, error: TaskError) {
    console.log(error)
    const task = this.searchTask(index)
    if (task === undefined) return
    this.reloadTaskInDB(task)
    this.emit('taskStatusChange', task.taskId)
    task.removeAllListeners()
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
  if (queue !== undefined) {
    queue.clearAllTask()
    queue.removeAllListeners()
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
