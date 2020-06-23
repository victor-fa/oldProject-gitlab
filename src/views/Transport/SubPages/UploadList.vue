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
import { uploadQueue } from '../../../api/Transport/TransportHelper'
import { TaskStatus, TaskError, FileInfo } from '../../../api/Transport/BaseTask'
import UploadTask from '../../../api/Transport/UploadTask'
import StringUtility from '../../../utils/StringUtility'
import TransportHandler from '../TransportHandler'
import { TransportModel, uploadCategorys, TransportStatus } from '../MainPage/TransportModel'
import { EventBus } from '../../../utils/eventBus'
import { EventName } from '../../../utils/processCenter'

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
      this.dataArray = tasks.map(task => {
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
    },
    removeObserver () {
      uploadQueue.removeAllListeners()
    },
    handleTaskStatusChange (taskId: number) {
      const task = uploadQueue.searchTask(taskId)
      const index = TransportHandler.searchModel(this.dataArray, taskId)
      if (task === undefined || index === undefined) return
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
          break;
        case 'resumeAll':
          uploadQueue.resumeAllTasks()
          break;
        case 'cancelAll':
          uploadQueue.deleteDoingTasks()
          break;
        case 'clearAll':
          uploadQueue.deleteDoneTasks()
          break;
        default:
          break;
      }
    },
    handleItemAction(command: string, index: number, ...args: any[]) {
      const model = this.showArray[index]
      const task = uploadQueue.searchTask(model.id)
      if (task === undefined) return
      const { shell } = require('electron')
      switch (command) {
        case 'delete':
        case 'cancel':
          uploadQueue.deleteTask(task)
          break
        case 'pause':
          uploadQueue.suspendTask(task)
          break
        case 'continue':
          uploadQueue.resumeTask(task)
          break
        case 'refresh':
          uploadQueue.reloadTask(task)
          break
        case 'jump':
          EventBus.$emit(EventName.jump, { path: task.fullPath(), uuid: task.uuid })
          break
        case 'open':
          shell.openItem(task.srcPath)
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
