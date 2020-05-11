<template>
  <main-page
    :category="category"
    :dataSource="dataArray"
    :currentTab="'upload'"
    v-on:categoryChange="handleCategoryChange"
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
</template>

<script lang="ts">
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import { uploadCategorys } from '../../../model/categoryList'
import TransportItem from '../MainPage/TransportItem.vue'
import { uploadQueue } from '../../../api/Transport/TransportQueue'
import { EventBus, EventType } from '../../../utils/eventBus'
import { TaskStatus } from '../../../api/Transport/BaseTask'
import UploadTask from '../../../api/Transport/UploadTask'

export default Vue.extend({
  name: 'upload-list',
  components: {
    MainPage,
    TransportItem
  },
  data () {
    return {
      dataArray: [] as any,
      category: uploadCategorys,
      state: TaskStatus.pending
    }
  },
  created () {
    this.resetSelected()
    this.getListData()
    uploadQueue.on('fileFinished', (task, fileInfo) => {  // 接收完成结果
      setTimeout(() => { this.getListData() }, 1000);
    })
  },
  methods: {
    // handle views action
    handleCategoryChange (index: number) {  // 切换"正在上传"、"上传完成"
      this.state = index
      this.getListData()
    },
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
        case 'clearAll': // 清除所有记录
          this.clearAllTrans()
          break;
        default:
          break;
      }
    },
    // inner private methods
    resetSelected() { // 重置默认选项
      uploadCategorys[0].isSelected = true
      uploadCategorys[1].isSelected = false
    },
    pauseAllTrans() { // 全部暂停
      const _this = this as any
      let pauseCount = 0
      const filterArr = [TaskStatus.progress]
      _this.dataArray.forEach((item:any) => filterArr.indexOf(item.status) > -1 ? pauseCount++ : null)
      if (pauseCount === 0) {
        _this.$message.warning('无可暂停任务')
      }
      _this.dataArray.forEach((item: UploadTask) => {
        if (filterArr.indexOf(item.status) > -1) {
          item.suspend()
          // item.status = TaskStatus.suspend
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
      const filterArr = [TaskStatus.suspend]
      _this.dataArray.forEach((item:any) => filterArr.indexOf(item.status) > -1 ? resumeCount++ : null)
      if (resumeCount === 0) {
        _this.$message.warning('无可开始任务')
      }
      _this.dataArray.forEach((item: UploadTask) => {
        if (filterArr.indexOf(item.status) > -1) {
          item.resume()
          // item.status = TaskStatus.uploading
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
      const filterArr = [TaskStatus.pending, TaskStatus.progress, TaskStatus.suspend]
      _this.dataArray.forEach((item:any) => filterArr.indexOf(item.status) > -1 ? cancelCount++ : null)
      if (cancelCount === 0) {
        _this.$message.warning('无可取消任务')
      }
      _this.dataArray.forEach((item:any) => {
        if (filterArr.indexOf(item.status) > -1) {
          uploadQueue.deleteTask(item)
        }
      });
      setTimeout(() => { _this.getListData() }, 1000);
    },
    clearAllTrans() { // 清空所有记录
      const _this = this as any
      _this.$electron.shell.beep()
      _this.$confirm({
        title: '删除',
        content: '是否将所所有记录清空',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          _this.dataArray.forEach((item:any) => {
            uploadQueue.deleteTask(item)
          });
          setTimeout(() => { _this.getListData() }, 1000);
        }
      });
    },
    getListData () {
      const list = uploadQueue.getAllTasks()
      console.log(JSON.parse(JSON.stringify(list)));
      const filterDoingArr = [TaskStatus.pending, TaskStatus.progress, TaskStatus.suspend, TaskStatus.error]
      const filterDoneArr = [TaskStatus.finished]
      uploadCategorys[0].count = list.filter((item:any) => filterDoingArr.indexOf(item.status) > -1).length  // 正在上传
      uploadCategorys[1].count = list.filter((item:any) => filterDoneArr.indexOf(item.status) > -1).length  // 上传完成
      if (this.state === TaskStatus.pending) {
        this.dataArray = list.filter((item:any) => filterDoingArr.indexOf(item.status) > -1)
      } else {
        this.dataArray = list.filter((item:any) => filterDoneArr.indexOf(item.status) > -1)
      }
    },
    // inner private methods
    handleItemAction(command: string, ...args: any[]) {
      const item: UploadTask = this.dataArray[args[0]]
      console.log(JSON.parse(JSON.stringify(item)));
      const _this = this as any
      switch (command) {
        case 'cancel':  // 取消
          uploadQueue.deleteTask(item)
          _this.getListData()
          break;
        case 'pause': // 暂停 开始
          const refKey = 'renderItem' + item.srcPath
          const cell: any = this.$refs[refKey]
          if (item.status === TaskStatus.suspend) {
            item.resume()
            // item.status = TaskStatus.uploading
            cell.setOperateItemDisable('continue', true)
            cell.updateContinueItem()
          } else if (item.status === TaskStatus.progress) {
            item.suspend()
            // item.status = TaskStatus.suspend
            cell.setOperateItemDisable('pause', true)
            cell.updatePauseItem()
          } else if (item.status === TaskStatus.error) {
            item.resume()
            // item.status = TaskStatus.uploading
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
          uploadQueue.deleteTask(item)
          _this.getListData()
          break;
        default:
          break;
      }
    },
  }
})

</script>

<style lang="less" scoped>

</style>
