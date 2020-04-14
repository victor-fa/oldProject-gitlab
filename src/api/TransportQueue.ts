// 传输队列，管理上传下载队列
import _ from 'lodash'
import { UploadTask, UploadStatus, FileInfo, UploadError, UploadTaskDelegate } from './UploadTask'
import { DownloadTask } from './DownloadTask'
import { UPLOAD_QUEUE } from '@/common/constants'

interface UploadQueueDelegate {
  // 任务添加成功回调
  didAddTask: (task: UploadTask) => void
  // 任务删除成功回调
  didRemoveTask: (task: UploadTask) => void
  // 任务状态改变回调
  didUpdateTask: (task: UploadTask, error?: UploadError) => void
  // 目录中的单个文件上传完成回调
  didUpdateFileInfo: (task: UploadTask, fileInfo: FileInfo) => void
}

class UploadQueue implements UploadTaskDelegate {
  maxCount = 5 // 最大任务数
  delegate?: UploadQueueDelegate // 上传队列代理
  private queue: UploadTask[] // 任务队列
  constructor () {
    this.queue = []
    const json = localStorage.getItem(UPLOAD_QUEUE)
    if (json === null) return
    const queue = JSON.parse(json)
    if (!_.isEmpty(queue)) {
      this.queue = queue
      this.checkUploadQueue()
    }
  }
  // upload methods
  getAllTasks () {
    return this.queue
  }
  addTask (task: UploadTask) {
    task.index = this.queue.length
    this.queue.push(task)
    this.cacheQueue()
    this.checkUploadQueue()
    this.delegate !== undefined && this.delegate.didAddTask(task)
  }
  cancelTask (task: UploadTask) {
    task.cancel()
    this.queue = this.removeTask(task)
    this.cacheQueue()
    this.checkUploadQueue()
    this.delegate !== undefined && this.delegate.didRemoveTask(task)
  }
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
  checkUploadQueue () {
    const uploadingQueue = this.getUploadingQueue()
    if (uploadingQueue.length < this.maxCount) {
      for (let index = 0; index < this.queue.length; index++) {
        const task = this.queue[index]
        if (task.status === UploadStatus.pending) {
          task.delegate = this
          task.start()
          return
        }
      }
    }
  }
  // 获取正在上传中的任务队列
  getUploadingQueue () {
    return this.queue.filter(item => {
      return item.status === UploadStatus.uploading
    })
  }
  // 移除task,并更新其它任务的标识符
  removeTask (task: UploadTask) {
    const index = task.index
    return this.queue.filter((task, aIndex) => {
      if (aIndex === index) return false
      if (aIndex > index) task.index = aIndex - 1
      return true
    })
  }
  // 上传任务状态改变就同步到本地缓存
  cacheQueue () {
    if (this.queue.length === 0) return Promise.resolve()
    return new Promise((resolve, reject) => {
      try {
        const json = JSON.stringify(this.queue, (key, value) => {
          return key === 'delegate' ? undefined : value
        })
        localStorage.setItem(UPLOAD_QUEUE, json)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }
  // upload task delegate callback
  uploadTaskProcessChange (task: UploadTask) {
    this.delegate !== undefined && this.delegate.didUpdateTask(task)
  }
  fileInfoStatusChange (task: UploadTask, fileInfo: FileInfo) {
    this.delegate !== undefined && this.delegate.didUpdateFileInfo(task, fileInfo)
    this.cacheQueue()
  }
  uploadTaskStatusChange (task: UploadTask, error?: UploadError) {
    task.delegate = undefined // 防止循环引用
    this.delegate !== undefined && this.delegate.didUpdateTask(task, error)
    this.checkUploadQueue()
    console.log(task)
  }
}

const uploadQueue = new UploadQueue()

export {
  UploadQueue,
  UploadQueueDelegate,
  uploadQueue
}

export default {
  // public methods
  // 监听主窗口关闭
  observeHomeWindowClosed () {
    const { BrowserWindow } = require('electron').remote
    const homeWindow = BrowserWindow.getFocusedWindow()
    if (homeWindow === null) return
    homeWindow.on('close', () => {
      
    })
  }
}
