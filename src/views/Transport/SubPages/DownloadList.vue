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
import { TaskStatus, FileInfo, TaskError } from '../../../api/Transport/BaseTask'
import DownloadTask from '../../../api/Transport/DownloadTask'
import { downloadQueue } from '../../../api/Transport/TransportHelper'
import { TransportModel, downloadCategorys, TransportStatus, TransportCategory } from '../MainPage/TransportModel'
import TransportHandler from '../TransportHandler'
import { EventBus } from '../../../utils/eventBus'
import { EventName } from '../../../utils/processCenter'

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
      this.dataArray = tasks.map(task => {
        return TransportHandler.convertTask(task)
      })
      this.updateView()
    },
    updateView () {
      const category = this.categorys.filter(item => {
        return item.isSelected
      })[0].status
      // list view
      this.showArray = this.dataArray.filter(model => {
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
          return item
        })
        return item
      })
    },
    observerDownloadQueue () {
      downloadQueue.addListener('taskStatusChange', this.handleTaskStatusChange)
      downloadQueue.addListener('taskQueueChange', this.handleTaskQueueChange)
    },
    removeObserver () {
      downloadQueue.removeAllListeners()
    },
    handleTaskStatusChange (taskId: number) {
      const task = downloadQueue.searchTask(taskId)
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
          break;
        case 'resumeAll':
          downloadQueue.resumeAllTasks()
          break;
        case 'cancelAll':
          downloadQueue.deleteDoingTasks()
          break;
        case 'clearAll':
          downloadQueue.deleteDoneTasks()
          break;
        default:
          break;
      }
    },
    handleItemAction(command: string, index: number, ...args: any[]) {
      const model = this.showArray[index]
      const task = downloadQueue.searchTask(model.id)
      if (task === undefined) return
      const { shell } = require('electron')
      switch (command) {
        case 'delete':
        case 'cancel':
          downloadQueue.deleteTask(task)
          break
        case 'pause':
          downloadQueue.suspendTask(task)
          break
        case 'continue':
          downloadQueue.resumeTask(task)
          break
        case 'refresh':
          downloadQueue.reloadTask(task)
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
