<template>
  <div>
    <main-page
      :category="category"
      :dataSource="dataArray"
      :currentTab="'backup'"
      v-on:transportOperateAction="handleOperateAction"
    >
      <template v-slot:renderItem="{ item, index}">
        <transport-item
          :ref="'renderItem' + item.srcPath"
          :key="item.srcPath"
          :model="item"
          :index="index"
          v-on:operationAction="handleItemAction"
        />
      </template>
    </main-page>
  </div>
</template>

<script lang="ts">
import _ from 'lodash' 
import fs from 'fs'
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import { downloadCategorys } from '../MainPage/TransportModel'
import TransportItem from '../MainPage/TransportItem.vue'
import StringUtility from '@/utils/StringUtility'
import BackupUploadTask from '@/api/Transport/BackupUploadTask'
import { TaskStatus } from '@/api/Transport/BaseTask'
import ClientAPI from '@/api/ClientAPI'
import { backupUploadQueue } from '../../../api/Transport/TransportHelper'

export default Vue.extend({
  name: 'backup-list',
  components: {
    MainPage,
    TransportItem
  },
  data () {
    return {
      dataArray: [] as BackupUploadTask[],
      category: _.cloneDeep(downloadCategorys),
      state: TaskStatus.pending
    }
  },
  created () {
    this.getListData()
    backupUploadQueue.on('fileFinished', (task, fileInfo) => {  // 接收完成结果
      // this.$store.dispatch('Resource/decreaseTask')
      setTimeout(() => { this.getListData() }, 1000);
    })
  },
  methods: {
    // handle views action
    handleOperateAction (command: string) {
      switch (command) {
        case 'pauseAll':  // 全部暂停
          this.pauseAllTrans()
          break;
        case 'resumeAll':  // 全部开始
          this.resumeAllTrans()
          break;
        case 'cancelAll': // 全部取消
          this.cancelAllTrans()
          break;
        case 'backupFolder': // 上传文件夹
          this.showOpenDialog()
          break;
        default:
          break;
      }
    },
    // inner private methods
    pauseAllTrans() { // 全部暂停
      let pauseCount = 0
      for (let index = 0; index < this.dataArray.length; index++) {
        const ele = this.dataArray[index]
        if (ele.status === TaskStatus.progress) {
          pauseCount++
          break
        }
      }
      if (pauseCount === 0) {
        this.$message.warning('无可暂停任务')
      }
      this.dataArray.forEach((item: BackupUploadTask) => {
        if (pauseCount > 0) {
          item.suspend()
          const refKey = 'renderItem' + item.srcPath
          const cell: any = this.$refs[refKey]
          cell.setOperateItemDisable('pause', true)
          cell.updatePauseItem()
        }
      });
      setTimeout(() => { this.getListData() }, 1000);
    },
    resumeAllTrans() {  // 全部开始
      let resumeCount = 0
      for (let index = 0; index < this.dataArray.length; index++) {
        const ele = this.dataArray[index]
        if (ele.status === TaskStatus.suspend) {
          resumeCount++
          break
        }
      }
      if (resumeCount === 0) {
        this.$message.warning('无可开始任务')
      }
      this.dataArray.forEach((item: BackupUploadTask) => {
        if (resumeCount > 0) {
          item.resume()
          const refKey = 'renderItem' + item.srcPath
          const cell: any = this.$refs[refKey]
          cell.setOperateItemDisable('continue', true)
          cell.updateContinueItem()
        }
      });
      setTimeout(() => { this.getListData() }, 1000);
    },
    cancelAllTrans() { // 取消所有
      let cancelCount = 0
      for (let index = 0; index < this.dataArray.length; index++) {
        const ele = this.dataArray[index]
        if (ele.status === TaskStatus.pending || ele.status === TaskStatus.progress || ele.status === TaskStatus.suspend) {
          cancelCount++
          break
        }
      }
      if (cancelCount === 0) {
        this.$message.warning('无可取消任务')
      }
      this.dataArray.forEach((item:any) => {
        if (cancelCount > 0) {
          backupUploadQueue.deleteTask(item)
        }
      });
      setTimeout(() => { this.getListData() }, 1000);
    },
    handleItemAction(command: string, ...args: any[]) {
      const item: BackupUploadTask = this.dataArray[args[0]]
      const _this = this as any
      const refKey = 'renderItem' + item.srcPath
      const cell: any = this.$refs[refKey]
      switch (command) {
        case 'cancel':  // 取消
          backupUploadQueue.deleteTask(item)
          this.getListData()
          break;
        case 'pause': // 暂停 开始
          if (item.status === TaskStatus.suspend) { // 暂停 -> 开始
            item.resume()
            cell.setOperateItemDisable('continue', true)
            cell.updateContinueItem()
          } else if (item.status === TaskStatus.progress) { // 开始 -> 暂停
            item.suspend()
            cell.setOperateItemDisable('pause', true)
            cell.updatePauseItem()
          } else if (item.status === TaskStatus.error) { // 报错 -> 开始
            item.resume()
            cell.setOperateItemDisable('error', true)
            cell.updateErrorItem()
          }
          break;
        case 'continue': // 暂停 开始
          if (item.status === TaskStatus.suspend) { // 暂停 -> 开始
            item.resume()
            cell.setOperateItemDisable('continue', true)
            cell.updateContinueItem()
          } else if (item.status === TaskStatus.progress) { // 开始 -> 暂停
            item.suspend()
            cell.setOperateItemDisable('pause', true)
            cell.updatePauseItem()
          } else if (item.status === TaskStatus.error) { // 报错 -> 开始
            item.resume()
            cell.setOperateItemDisable('error', true)
            cell.updateErrorItem()
          }
          break;
        case 'jump': // 打开所在文件夹
          _this.$electron.shell.showItemInFolder(item.srcPath)
          break;
        case 'open': // 打开文件
          _this.$electron.shell.openItem(item.srcPath)
          break;
        case 'openInFinder': // 打开所在文件夹
          _this.$electron.shell.showItemInFolder(StringUtility.convertL2R(item.srcPath))
          break;
        case 'delete': // 删除
          backupUploadQueue.deleteTask(item)
          _this.getListData()
          break;
        default:
          break;
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
        if (_.isEmpty(result.filePaths)) return
        result.filePaths.forEach(path => {
          path = StringUtility.convertR2L(path)
          const destPath = require("os").hostname() + ClientAPI.getMac() + '/' + path
          const task = new BackupUploadTask(path, destPath, '')
          backupUploadQueue.addTask(task)
          backupUploadQueue.once('taskFinished', () => {
            setTimeout(() => {
              this.getListData()
            }, 1000);
          })
          this.$store.dispatch('Resource/increaseTask')
        })
      })
    },
    getListData () {
      const list = backupUploadQueue.getAllTasks()
      let filterList:any = []
      filterList = list.filter(item => item.fileInfos.length > 0)
      console.log(JSON.parse(JSON.stringify(filterList)));
      const filterAarr = [TaskStatus.pending, TaskStatus.progress, TaskStatus.suspend, TaskStatus.error]
      downloadCategorys[0].count = filterList.filter((item:any) => (filterAarr.indexOf(item.status) > -1)).length
      this.dataArray = StringUtility.filterRepeatPath(filterList)
    }
  }
})
</script>

<style lang="less" scoped>
</style>
