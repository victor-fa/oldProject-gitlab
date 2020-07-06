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
import { uploadQueue, encryptUploadQueue } from '../../../api/Transport/TransportHelper'
import BaseTask, { TaskStatus, TaskError, FileInfo } from '../../../api/Transport/BaseTask'
import UploadTask from '../../../api/Transport/UploadTask'
import StringUtility from '../../../utils/StringUtility'
import TransportHandler from '../TransportHandler'
import { TransportModel, uploadCategorys, TransportStatus } from '../MainPage/TransportModel'
import { EventBus } from '../../../utils/eventBus'
import { EventName } from '../../../utils/processCenter'
import TaskQueue from '../../../api/Transport/TransportQueue'
import fs from 'fs'

export default Vue.extend({
  name: 'upload-list',
  components: {
    MainPage
  },
  data () {
    return {
      dataArray: [] as TransportModel[],
      showArray: [] as TransportModel[],
      categorys: _.cloneDeep(uploadCategorys)
    }
  },
  created () {
    this.fetchUploadTasks()
    this.observerUploadQueue()
  },
  destroyed () {
    this.removeObserver()
  },
  methods: {
    fetchUploadTasks () {
      const tasks = uploadQueue.getAllTasks()
      const encryptTasks = encryptUploadQueue.getAllTasks()
      this.dataArray = tasks.concat(encryptTasks).map(task => {
        return TransportHandler.convertTask(task)
      })
      this.updateView()
    },
    updateView () {
      const category = this.categorys.filter(item => {
        return item.isSelected
      })[0].status
      let canResumeAll = true
      this.showArray = this.dataArray.filter(model => {
        if (model.status !== TaskStatus.suspend && model.status !== TaskStatus.error) canResumeAll = false
        return model.category === category
      })
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
    observerUploadQueue () {
      this.removeObserver()
      uploadQueue.addListener('taskStatusChange', this.handleTaskStatusChange)
      uploadQueue.addListener('taskQueueChange', this.handleTaskQueueChange)
      encryptUploadQueue.addListener('taskStatusChange', this.handleTaskStatusChange)
      encryptUploadQueue.addListener('taskQueueChange', this.handleTaskQueueChange)
    },
    removeObserver () {
      uploadQueue.removeAllListeners()
      encryptUploadQueue.removeAllListeners()
    },
    handleTaskStatusChange (taskId: number) {
      const task = uploadQueue.searchTask(taskId)
      if (task === undefined) return
      this.reloadListItem(task)
    },
    handleEncryptTaskStatusChange (taskId: number) {
      const task = encryptUploadQueue.searchTask(taskId)
      if (task === undefined) return
      this.reloadListItem(task)
    },
    reloadListItem<T extends BaseTask> (task: T) {
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
      this.fetchUploadTasks()
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
          uploadQueue.suspendAllTasks()
          encryptUploadQueue.suspendAllTasks()
          break;
        case 'resumeAll':
          uploadQueue.resumeAllTasks()
          encryptUploadQueue.resumeAllTasks()
          break;
        case 'cancelAll':
          uploadQueue.deleteDoingTasks()
          encryptUploadQueue.deleteDoingTasks()
          break;
        case 'clearAll':
          uploadQueue.deleteDoneTasks()
          encryptUploadQueue.deleteDoneTasks()
          break;
        default:
          break;
      }
    },
    handleItemAction (command: string, index: number, ...args: any[]) {
      const model = this.showArray[index]
      if (model.type === 'upload') {
        this.handleTaskOperate(command, uploadQueue, model.id)
      } else {
        this.handleTaskOperate(command, encryptUploadQueue, model.id)
      }
    },
    handleTaskOperate<T extends BaseTask> (command: string, queue: TaskQueue<T>, taskId: number) {
      const task = queue.searchTask(taskId)
      if (task === undefined) return
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
          EventBus.$emit(EventName.jump, { path: task.fullPath(), uuid: task.uuid })
          break
        case 'open':
          this.handleOpenAction(task, false)
          break
        case 'openInFinder':
          this.handleOpenAction(task, true)
          break
        default:
          break
      }
    },
    handleOpenAction<T extends BaseTask> (task: T, isFinder: boolean) {
      const localPath = process.platform === 'win32' ? StringUtility.convertL2R(task.fullPath()) : task.fullPath()
      const exist = fs.existsSync(task.fullPath())
      if (!exist) {
        this.$message.error('文件不存在')
        return
      } 
      const { shell } = require('electron')
      isFinder ? shell.showItemInFolder(localPath) : shell.openItem(localPath)
    }
  }
})
</script>

<style lang="less" scoped>

</style>
