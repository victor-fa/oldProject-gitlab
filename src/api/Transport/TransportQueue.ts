// 传输队列，管理上传下载队列
import _ from 'lodash'
import { EventEmitter } from 'events'
import BaseTask, { TaskStatus, FileInfo, TaskError, TaskErrorCode } from './BaseTask'
import UploadTask from './UploadTask'
import BackupUploadTask from './BackupUploadTask'
import EncryptUploadTask from './EncryptUploadTask'
import DownloadTask from './DownloadTask'
import EncryptDownloadTask from './EncryptDownloadTask'

/**
 * taskStatusChange (taskId) 任务状态改变事件
 * taskQueueChange () 任务队列数量改变
*/
export default class TaskQueue<T extends BaseTask> extends EventEmitter {
  /**最大任务数 */
  maxCount = 5
  /**数据库对象 */
  db?: IDBDatabase
  private queue: T[]
  private tableName: string
  constructor (tableName: string) {
    super()
    this.tableName = tableName
    this.queue = []
    this.setMaxListeners(25)
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
    this.deleteTaskInDB(task)
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
  async deleteDoingTasks () {
    const ids: number[] = []
    for (let index = 0; index < this.queue.length; index++) {
      const task = this.queue[index]
      if (task.status !== TaskStatus.finished) {
        await task.cancel()
        await this.deleteTaskInDB(task)
        ids.push(task.taskId)
      }
    }
    this.queue = this.queue.filter(task => {
      return ids.indexOf(task.taskId) === -1
    })
    this.emit('taskQueueChange')
  }
  /**删除已完成的任务 */
  async deleteDoneTasks () {
    const ids: number[] = []
    for (let index = 0; index < this.queue.length; index++) {
      const task = this.queue[index]
      if (task.status === TaskStatus.finished) {
        await task.cancel()
        await this.deleteTaskInDB(task)
        ids.push(task.taskId)
      }
    }
    this.queue = this.queue.filter(task => {
      return ids.indexOf(task.taskId) === -1
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
    // this.clearTable(this.db)
  }
  /**创建任务表 */
  createTable (db: IDBDatabase) {
    if (!db.objectStoreNames.contains(this.tableName)) {
      db.createObjectStore(this.tableName, { keyPath: 'index' })
    }
  }
  /**读取表中数据 */
  readDBTasks (db: IDBDatabase) {
    this.db = db
    if (db.objectStoreNames.length > 0) {
      const objectStore = db.transaction(this.tableName, 'readonly').objectStore(this.tableName)
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
  // private methods
  private generateTaskId () {
    const task = _.last(this.queue)
    if (task === undefined) return 0
    return task.taskId + 1
  }
  private clearTable (db?: IDBDatabase) {
    if (db === undefined) return
    if (db.objectStoreNames.contains(this.tableName)) {
      const objectStore = db.transaction(this.tableName, 'readwrite').objectStore(this.tableName)
      objectStore.clear()
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
      icon: task.icon,
      type: task.type
    }
  }
  // 将DB中存储的对象转换成task
  private convertObj2Task (obj: any) {
    const task = this.createTask(obj)
    task.taskId = obj.index
    task.countOfBytes = obj.countOfBytes
    task.completedBytes = obj.completedBytes
    task.fileInfos = obj.fileInfos
    task.status = obj.status
    task.icon = obj.icon
    task.type = obj.type
    return task as T
  }
  private createTask (obj: any) {
    const type = obj.type, srcPath = obj.srcPath, destPath = obj.destPath, uuid = obj.uuid
    switch (type) {
      case 'upload':
        return new UploadTask(srcPath, destPath, uuid)
      case 'encryptUpload':
        return new EncryptUploadTask(srcPath, destPath, uuid)
      case 'backupUpload':
        return new BackupUploadTask(srcPath, destPath, uuid)
      case 'download':
        return new DownloadTask(srcPath, destPath, uuid)
      case 'encryptDownload':
        return new EncryptDownloadTask(srcPath, destPath, uuid)
      default:
        return new BaseTask(srcPath, destPath, uuid)
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
    task.addListener('fileBegin', (index: number, fileInfo: FileInfo) => {
      this.handleFileBegin(index, fileInfo)
    })
    task.addListener('fileFinished', (index: number, fileInfo: FileInfo) => {
      this.handleFileFinished(index, fileInfo)
    })
    task.addListener('taskSuspend', (index: number) => {
      this.handleTaskSuspend(index)
    })
    task.addListener('taskResume', (index: number) => {
      this.handleTaskResume(index)
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
  protected handleTaskProcess (taskId: number) {
    this.emit('taskStatusChange', taskId)
  }
  protected handleFileBegin (taskId: number, fileInfo: FileInfo) {
    this.emit('taskStatusChange', taskId)
  }
  protected handleFileFinished (taskId: number, fileInfo: FileInfo) {
    console.log(fileInfo)
    const task = this.searchTask(taskId)
    if (task === undefined) return
    this.reloadTaskInDB(task)
  }
  protected handleTaskSuspend (taskId: number) {
    this.checkUploadQueue()
    const task = this.searchTask(taskId)
    if (task === undefined) return
    this.reloadTaskInDB(task)
  }
  protected handleTaskResume (taskId: number) {
    this.emit('taskStatusChange', taskId)
  }
  protected handleTaskFinished (taskId: number) {
    this.checkUploadQueue()
    const task = this.searchTask(taskId)
    if (task === undefined) return
    this.reloadTaskInDB(task)
    this.emit('taskStatusChange', task.taskId)
    task.removeAllListeners()
  }
  protected handleTaskError (taskId: number, error: TaskError) {
    console.log(error)
    this.checkUploadQueue()
    const task = this.searchTask(taskId)
    if (task === undefined) return
    this.reloadTaskInDB(task)
    this.emit('taskStatusChange', task.taskId)
    task.removeAllListeners()
  }
}
