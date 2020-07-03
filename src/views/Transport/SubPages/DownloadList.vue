<template>
  <main-page
    :categorys="categorys"
    :dataSource="showArray"
    v-on:itemAction="handleItemAction"
    v-on:categoryChange="handleCategoryChange"
    v-on:batchAction="handleOperateAction"
  />
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import StringUtility from '../../../utils/StringUtility'
import BaseTask, { TaskStatus, FileInfo, TaskError } from '../../../api/Transport/BaseTask'
import DownloadTask from '../../../api/Transport/DownloadTask'
import { downloadQueue, encryptDownloadQueue, encryptUploadQueue } from '../../../api/Transport/TransportHelper'
import { TransportModel, downloadCategorys, TransportStatus, TransportCategory } from '../MainPage/TransportModel'
import TransportHandler from '../TransportHandler'
import { EventBus } from '../../../utils/eventBus'
import { EventName } from '../../../utils/processCenter'
import TaskQueue from '../../../api/Transport/TransportQueue'

export default Vue.extend({
  name: 'download-list',
  components: {
    MainPage
  },
  data () {
    return {
      dataArray: [] as TransportModel[],
      showArray: [] as TransportModel[],
      categorys: _.cloneDeep(downloadCategorys)
    }
  },
  created () {
    this.fetchDownloadTasks()
    this.observerDownloadQueue()
  },
  destroyed () {
    this.removeObserver()
  },
  methods: {
    // inner private methods
    fetchDownloadTasks () {
      const tasks = downloadQueue.getAllTasks()
      const encryptTasks = encryptDownloadQueue.getAllTasks()
      this.dataArray = tasks.concat(encryptTasks).map(task => {
        return TransportHandler.convertTask(task)
      })
      this.updateView()
    },
    updateView () {
      const category = this.categorys.filter(item => {
        return item.isSelected
      })[0].status
      // list view
      let canResumeAll = true
      this.showArray = this.dataArray.filter(model => {
        if (model.status !== TaskStatus.suspend && model.status !== TaskStatus.error) canResumeAll = false
        return model.category === category
      })
      // header view
      this.categorys = this.categorys.map(item => {
        if (item.status === category) {
          item.count = this.showArray.length
        } else {
          item.count = this.dataArray.length - this.showArray.length
        }
        item.batchItems = item.batchItems.map(item => {
          item.disable = this.showArray.length === 0
          if (item.command === 'pauseAll') item.isHidden = canResumeAll
          if (item.command === 'resumeAll') item.isHidden = !canResumeAll
          return item
        })
        return item
      })
    },
    observerDownloadQueue () {
      downloadQueue.addListener('taskStatusChange', this.handleTaskStatusChange)
      downloadQueue.addListener('taskQueueChange', this.handleTaskQueueChange)
      encryptUploadQueue.addListener('taskStatusChange', this.handleTaskStatusChange)
      encryptUploadQueue.addListener('taskQueueChange', this.handleTaskQueueChange)
    },
    removeObserver () {
      downloadQueue.removeAllListeners()
      encryptUploadQueue.removeAllListeners()
    },
    handleTaskStatusChange (taskId: number) {
      const task = downloadQueue.searchTask(taskId)
      if (task === undefined) return
      this.reloadTaskStatus(task)
    },
    handleEncryptTaskStatusChange (taskId: number) {
      const task = encryptDownloadQueue.searchTask(taskId)
      if (task === undefined) return
      this.reloadTaskStatus(task)
    },
    reloadTaskStatus<T extends BaseTask> (task: T) {
      const index = TransportHandler.searchModel(this.dataArray, task.taskId)
      if (index === undefined) return
      const newItem = TransportHandler.convertTask(task)
      this.dataArray.splice(index, 1, newItem)
      this.updateView()
      if (task.error !== undefined && task.status === TaskStatus.error) {
        this.$message.error(task.error.desc)
      }
    },
    handleTaskQueueChange () {
      this.fetchDownloadTasks()
    },
    // handle views action
    handleCategoryChange (aIndex: number) {
      this.categorys = this.categorys.map((item, index) => {
        item.isSelected = index === aIndex
        return item
      })
      this.updateView()
    },
    handleOperateAction (command: string) {
      switch (command) {
        case 'pauseAll':
          downloadQueue.suspendAllTasks()
          encryptDownloadQueue.suspendAllTasks()
          break;
        case 'resumeAll':
          downloadQueue.resumeAllTasks()
          encryptDownloadQueue.resumeAllTasks()
          break;
        case 'cancelAll':
          downloadQueue.deleteDoingTasks()
          encryptDownloadQueue.deleteDoingTasks()
          break;
        case 'clearAll':
          downloadQueue.deleteDoneTasks()
          encryptDownloadQueue.deleteDoneTasks()
          break;
        default:
          break;
      }
    },
    handleItemAction(command: string, index: number, ...args: any[]) {
      const model = this.showArray[index]
      if (model.type === 'download') {
        this.handleTaskOperate(command, downloadQueue, model.id)
      } else {
        this.handleTaskOperate(command, encryptDownloadQueue, model.id)
      }
    },
    handleTaskOperate<T extends BaseTask> (command: string, queue: TaskQueue<T>, taskId: number) {
      const task = queue.searchTask(taskId)
      if (task === undefined) return
      const { shell } = require('electron')
      switch (command) {
        case 'delete':
        case 'cancel':
          queue.deleteTask(task)
          break
        case 'pause':
          queue.suspendTask(task)
          break
        case 'continue':
          queue.resumeTask(task)
          break
        case 'refresh':
          queue.reloadTask(task)
          break
        case 'jump':
          EventBus.$emit(EventName.jump, { path: task.srcPath, uuid: task.uuid })
          break
        case 'open':
          shell.openItem(task.fullPath())
          break
        case 'openInFinder':
          shell.showItemInFolder(process.platform === 'win32' ? StringUtility.convertL2R(task.srcPath) : task.srcPath)
          break
        default:
          break
      }
    }
  }
})
</script>

<style lang="less" scoped>

</style>
