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
import fs from 'fs'
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import StringUtility from '@/utils/StringUtility'
import BackupUploadTask from '@/api/Transport/BackupUploadTask'
import { TaskStatus, TaskError, FileInfo } from '@/api/Transport/BaseTask'
import ClientAPI from '@/api/ClientAPI'
import { backupUploadQueue } from '../../../api/Transport/TransportHelper'
import { TransportModel, backupCategorys, TransportStatus } from '../MainPage/TransportModel'
import TransportHandler from '../TransportHandler'
import { EventBus } from '../../../utils/eventBus'
import { EventName } from '../../../utils/processCenter'

export default Vue.extend({
  name: 'backup-list',
  components: {
    MainPage
  },
  data () {
    return {
      dataArray: [] as TransportModel[],
      categorys: _.cloneDeep(backupCategorys),
      showArray: [] as TransportModel[],
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
      const tasks = backupUploadQueue.getAllTasks()
      this.dataArray = tasks.map(task => {
        return TransportHandler.convertTask(task)
      })
      this.updateView()
    },
    updateView () {
      const category = this.categorys.filter(item => {
        return item.isSelected
      })[0].status
      this.showArray = this.dataArray.filter(model => {
        return model.category === category
      })
      this.categorys = this.categorys.map(item => {
        if (item.status === category) {
          item.count = this.showArray.length
        } else {
          item.count = this.dataArray.length - this.showArray.length
        }
        item.batchItems = item.batchItems.map(item => {
          item.disable = this.showArray.length === 0 && item.command !== 'addTask'
          return item
        })
        return item
      })
    },
    observerUploadQueue () {
      this.removeObserver()
      backupUploadQueue.addListener('taskStatusChange', this.handleTaskStatusChange)
      backupUploadQueue.addListener('taskQueueChange', this.handleTaskQueueChange)
    },
    removeObserver () {
      backupUploadQueue.removeAllListeners()
    },
    handleTaskStatusChange (taskId: number) {
      const task = backupUploadQueue.searchTask(taskId)
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
          backupUploadQueue.suspendAllTasks()
          break;
        case 'resumeAll':
          backupUploadQueue.resumeAllTasks()
          break;
        case 'cancelAll':
          backupUploadQueue.deleteDoingTasks()
          break;
        case 'clearAll':
          backupUploadQueue.deleteDoneTasks()
          setTimeout(() => this.fetchUploadTasks(), 1000);
          break;
        case 'addTask':
          this.showOpenDialog()
          break;
        default:
          break;
      }
    },
    handleItemAction(command: string, index: number, ...args: any[]) {
      const model = this.showArray[index]
      const task = backupUploadQueue.searchTask(model.id)
      if (task === undefined) return
      const { shell } = require('electron')
      switch (command) {
        case 'delete':
        case 'cancel':
          backupUploadQueue.deleteTask(task)
          break
        case 'pause':
          backupUploadQueue.suspendTask(task)
          break
        case 'continue':
          backupUploadQueue.resumeTask(task)
          break
        case 'refresh':
          backupUploadQueue.reloadTask(task)
          break
        case 'jump':
          EventBus.$emit(EventName.jump, { path: task.srcPath, uuid: task.uuid })
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
    },
    // 打开上传界面
    async showOpenDialog () {
      const { dialog, BrowserWindow } = require('electron').remote
      const list = ['createDirectory', 'openDirectory', 'multiSelections']
      await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
        buttonLabel: '选择',
        properties: (list as any)
      }).then(result => {
        this.updateView()
        if (_.isEmpty(result.filePaths)) return
        result.filePaths.forEach(path => {
          path = StringUtility.convertR2L(path)
          const task = new BackupUploadTask(path, '', '')
          backupUploadQueue.addTask(task)
          backupUploadQueue.once('taskFinished', () => {
            setTimeout(() => {
              this.fetchUploadTasks()
            }, 1000);
          })
          backupUploadQueue.once('error', (taskId: number, error: TaskError) => {
            this.$message.error(error.desc)
          })
        })
      })
    },
  }
})
</script>

<style lang="less" scoped>
</style>
