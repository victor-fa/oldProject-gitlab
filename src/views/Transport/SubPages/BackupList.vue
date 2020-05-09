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
import crypto from 'crypto'
import MainPage from '../MainPage/index.vue'
import { backupCategorys, UploadStatus } from '../../../model/categoryList'
import TransportItem from '../MainPage/TransportItem.vue'
import { backupUploadQueue } from '../../../api/Transport/TransportQueue'
import StringUtility from '../../../utils/StringUtility'
import BackupUploadTask from '../../../api/Transport/BackupUploadTask'
import NasFileAPI from '../../../api/NasFileAPI'
import ClientAPI from '../../../api/ClientAPI'

export default Vue.extend({
  name: 'backup-list',
  components: {
    MainPage,
    TransportItem
  },
  data () {
    return {
      dataArray: [] as any,
      category: backupCategorys,
      state: UploadStatus.pending
    }
  },
  computed: {
    path: function () {
      const path = this.$route.query.path as string
      return path
    },
    uuid: function () {
      const uuid = this.$route.query.uuid as string
      return uuid
    }
  },
  created () {
    this.getListData()
    backupUploadQueue.on('fileFinished', (task, fileInfo) => {  // 接收完成结果
      setTimeout(() => { this.getListData() }, 1000);
    })
  },
  methods: {
    // handle views action
    handleOperateAction (command: string) {
      const _this = this as any
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
      const _this = this as any
      let pauseCount = 0
      const filterAarr = [UploadStatus.uploading]
      _this.dataArray.forEach((item:any) => filterAarr.indexOf(item.status) > -1 ? pauseCount++ : null)
      if (pauseCount === 0) {
        _this.$message.warning('无可暂停任务')
      }
      _this.dataArray.forEach((item:any) => {
        if (filterAarr.indexOf(item.status) > -1) {
          backupUploadQueue.suspendTask(item)
          // item.status = UploadStatus.suspend
          const refKey = 'renderItem' + item.srcPath
          const cell: any = this.$refs[refKey]
          cell.setOperateItemDisable('pause', true)
          cell.updatePauseItem()
        }
      });
      setTimeout(() => { _this.getListData() }, 1000);
    },
    resumeAllTrans() {  // 全部开始
      const _this = this as any
      let resumeCount = 0
      const filterAarr = [UploadStatus.suspend]
      _this.dataArray.forEach((item:any) => filterAarr.indexOf(item.status) > -1 ? resumeCount++ : null)
      if (resumeCount === 0) {
        _this.$message.warning('无可开始任务')
      }
      _this.dataArray.forEach((item:any) => {
        if (filterAarr.indexOf(item.status) > -1) {
          backupUploadQueue.resumeTask(item)
          // item.status = UploadStatus.uploading
          const refKey = 'renderItem' + item.srcPath
          const cell: any = this.$refs[refKey]
          cell.setOperateItemDisable('continue', true)
          cell.updateContinueItem()
        }
      });
      setTimeout(() => { _this.getListData() }, 1000);
    },
    cancelAllTrans() { // 取消所有
      const _this = this as any
      let cancelCount = 0
      const filterAarr = [UploadStatus.pending, UploadStatus.uploading, UploadStatus.suspend]
      _this.dataArray.forEach((item:any) => filterAarr.indexOf(item.status) > -1 ? cancelCount++ : null)
      if (cancelCount === 0) {
        _this.$message.warning('无可取消任务')
      }
      _this.dataArray.forEach((item:any) => {
        if (filterAarr.indexOf(item.status) > -1) {
          backupUploadQueue.deleteTask(item)
        }
      });
      setTimeout(() => { _this.getListData() }, 1000);
    },
    handleItemAction(command: string, ...args: any[]) {
      const item:any = this.dataArray[args[0]]
      const _this = this as any
      switch (command) {
        case 'cancel':  // 取消
          backupUploadQueue.deleteTask(item)
          _this.getListData()
          break;
        case 'pause': // 暂停 开始
          const refKey = 'renderItem' + item.srcPath
          const cell: any = this.$refs[refKey]
          console.log(item.status);
          if (item.status === UploadStatus.suspend) {
            backupUploadQueue.resumeTask(item)
            // item.status = UploadStatus.uploading
            cell.setOperateItemDisable('continue', true)
            cell.updateContinueItem()
          } else if (item.status === UploadStatus.uploading) {
            backupUploadQueue.suspendTask(item)
            // item.status = UploadStatus.suspend
            cell.setOperateItemDisable('pause', true)
            cell.updatePauseItem()
          } else if (item.status === UploadStatus.error) {
            backupUploadQueue.resumeTask(item)
            // item.status = UploadStatus.uploading
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
          _this.$electron.shell.showItemInFolder(item.srcPath)
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
        const newCommand = 'upload'
        // filter cancel action
        if (_.isEmpty(result.filePaths)) return
        result.filePaths.forEach(path => {
          // await this.deepTraverseDirectory(path).then(res => {
            console.log(path);
            // res.forEach(item => {
              // if (item.noRepeat) {
          const task = new BackupUploadTask(path, this.path, this.uuid)
          backupUploadQueue.addTask(task)
          this.$store.dispatch('Resource/increaseTask')
          this.getListData()
              // }
            // })
          // }).catch(error => {
          //   console.log(error);
          // })
        })
      })
    },
    checkPath (path, md5) {
      return new Promise((resolve, reject) => {
        const hostName = require("os").hostname() + ClientAPI.getMac()
        const pathP = '/' + StringUtility.convertR2L(hostName + '\\' + path)
        NasFileAPI.backupCheck(pathP, md5).then(response => {
          if (response.data.code !== 200) return resolve(false)
          if (response.data.data.identical === 1) return resolve(false)
          return resolve(true)
        }).catch(error => {
          reject(error)
        })
      })
    },
    calculatorFileMD5 (path: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(path)
        const fsHash = crypto.createHash('md5')
        stream.on('data', data => {
          fsHash.update(data)
        })
        stream.once('end', () => {
          const md5 = fsHash.digest('hex')
          resolve(md5)
        })
        stream.once('error', error => {
          reject(error)
        })
      })
    },
    // 深遍历目录文件
    deepTraverseDirectory (directory: string): Promise<any[]> {
      return new Promise((resolve, reject) => {
        let fileInfos:any = []
        fs.readdirSync(directory).forEach(async filename => {
          const path = StringUtility.convertR2L(directory + '/' + filename)
          const stats = fs.statSync(path)
          if (stats.isDirectory()) {
            await this.deepTraverseDirectory(path).then(files => {
              fileInfos = fileInfos.concat(files)
            })
          } else {
            await this.convertFileStats(path, stats).then(fileInfo => {
              fileInfos.push(fileInfo)
            }).catch(error => {
              reject(error)
            })
          }
          resolve(fileInfos)
        })
      })
    },
    /**转换stats */
    convertFileStats (path: string, stats: fs.Stats): Promise<any> {
      return new Promise(resolve => {
        const name = StringUtility.formatName(path)
        // this.doSomething(path).then(res => {
          const fileInfo: any = {
            path,
            name,
            // noRepeat: res,
          }
          resolve(fileInfo)
        // })
      })
    },
    doSomething (path) {
      return new Promise((resolve, reject) => {
        this.calculatorFileMD5(path).then(md5 => {
          console.log(path);
          return this.checkPath(path, md5)
        }).then(repeat => {
          console.log(repeat);
          resolve(repeat)
        }).catch(error => {
          console.log(error);
        })
      })
    },
    getListData () {
      const list = backupUploadQueue.getAllTasks()
      console.log(JSON.parse(JSON.stringify(list)));
      const filterAarr = [UploadStatus.pending, UploadStatus.uploading, UploadStatus.suspend, UploadStatus.error]
      backupCategorys[0].count = list.filter((item:any) => (filterAarr.indexOf(item.status) > -1)).length
      this.dataArray = StringUtility.filterRepeatPath(list)
    }
  }
})
</script>

<style lang="less" scoped>
</style>
