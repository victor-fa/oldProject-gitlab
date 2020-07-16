import _ from 'lodash'
import TaskQueue from "./TransportQueue"
import UploadTask from './UploadTask'
import BackupUploadTask from './BackupUploadTask'
import EncryptUploadTask from './EncryptUploadTask'
import DownloadTask from './DownloadTask'
import EncryptDownloadTask from './EncryptDownloadTask'
import BaseTask from './BaseTask'
import store from '@/store'
import { User } from '../UserModel'
import { NasInfo } from '../ClientModel'

let uploadQueue: TaskQueue<UploadTask>
let backupUploadQueue: TaskQueue<BackupUploadTask>
let encryptUploadQueue: TaskQueue<EncryptUploadTask>
let downloadQueue: TaskQueue<DownloadTask>
let encryptDownloadQueue: TaskQueue<EncryptDownloadTask>
let dataBase: IDBDatabase | undefined

export {
  uploadQueue,
  backupUploadQueue,
  encryptUploadQueue,
  downloadQueue,
  encryptDownloadQueue
}

export default class TransportHelper {
  /**初始化传输队列 */
  static initTransportQueue () {
    this.initAllQueue()
    this.openTransportDB().then(event => {
      this.readAllDataBase(event)
    }).catch(error => {
      console.log(error)
    })
  }
  /**清理传输队列缓存 */
  static clearQueueCache () {
    this.releaseAllQueue()
    if (dataBase !== undefined) {
      dataBase.close()
      dataBase = undefined
    }
  }
  /**挂起所有任务 */
  static suspendAllTask () {
    downloadQueue.suspendAllTasks()
    uploadQueue.suspendAllTasks()
  }
  // 初始全部化队列
  private static initAllQueue () {
    this.removeQueueListeners(uploadQueue)
    uploadQueue = new TaskQueue<UploadTask>('UploadQueue')
    this.removeQueueListeners(backupUploadQueue)
    backupUploadQueue = new TaskQueue<BackupUploadTask>('BackupQueue')
    this.removeQueueListeners(encryptUploadQueue)
    encryptUploadQueue = new TaskQueue<EncryptUploadTask>('EncryptQueue')
    this.removeQueueListeners(downloadQueue)
    downloadQueue = new TaskQueue<DownloadTask>('DownloadQueue')
    this.removeQueueListeners(encryptDownloadQueue)
    encryptDownloadQueue = new TaskQueue<EncryptDownloadTask>('EncryptDownloadQueue')
  }
  // 释放全部队列
  private static releaseAllQueue () {
    this.releaseQueue(uploadQueue)
    this.releaseQueue(backupUploadQueue)
    this.releaseQueue(encryptUploadQueue)
    this.releaseQueue(downloadQueue)
    this.releaseQueue(encryptDownloadQueue)
  }
  // 创建队列表
  private static createAllTables (event: IDBVersionChangeEvent) {
    const target = event.target as IDBOpenDBRequest
    const db = target.result
    uploadQueue.createTable(db)
    backupUploadQueue.createTable(db)
    encryptUploadQueue.createTable(db)
    downloadQueue.createTable(db)
    encryptDownloadQueue.createTable(db)
  }
  // 读取队列表
  private static readAllDataBase (event: Event) {
    const db = (event.target as IDBOpenDBRequest).result
    dataBase = db
    uploadQueue.readDBTasks(db)
    backupUploadQueue.readDBTasks(db)
    encryptUploadQueue.readDBTasks(db)
    downloadQueue.readDBTasks(db)
    encryptDownloadQueue.readDBTasks(db)
  }
  // 打开数据库
  private static openTransportDB (): Promise<Event> {
    return new Promise((resolve, reject) => {
      const versionNum = this.getVersionNumber()
      const name = this.getDataBaseName()
      const request = window.indexedDB.open(name, versionNum)
      request.onupgradeneeded = event => {
        this.createAllTables(event)
      }
      request.onsuccess = event => {
        resolve(event)
      }
      request.onerror = event => {
        reject(event)
      }
    })
  }
  // 获取数据库版本
  private static getVersionNumber () {
    const packageJson = require('../../../package.json')
    const version = packageJson.version as string
    let versionNumber = 0
    version.split('.').reverse().forEach((value, index) => {
      const pow = Math.pow(10, index * 2)
      versionNumber += Number(value) * pow
    })
    return versionNumber
  }
  // 获取数据库名称
  private static getDataBaseName () {
    const ugreenNo = (_.get(store.getters, 'User/user') as User).ugreenNo
    const sn = (_.get(store.getters, 'NasServer/nasInfo') as NasInfo).sn
    return `${ugreenNo}-${sn}`
  }
  // 释放队列
  private static releaseQueue<T extends BaseTask>(queue?: TaskQueue<T>) {
    if (queue === undefined) return
    queue.clearAllTask()
    queue.removeAllListeners()
    queue = undefined
  }
  // 移除队列监听
  private static removeQueueListeners<T extends BaseTask>(queue?: TaskQueue<T>) {
    if (queue === undefined) return
    const tasks = queue.getAllTasks()
    tasks.forEach(task => {
      task.removeAllListeners()
    })
    queue.removeAllListeners()
  }
}
