<template>
  <main-page
    :category="category"
    :dataSource="dataArray"
    :currentTab="'upload'"
    v-on:categoryChange="handleCategoryChange"
    v-on:transportOperateAction="handleOperateAction"
    v-on:CallbackControl="handleControl"
  >
    <template v-slot:renderItem="{ item, index}">
      <transport-item
        :ref="'renderItem' + item.id"
        :key="item.id"
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
import { TRANSFORM_INFO } from '../../../common/constants'
import { uploadCategorys } from '../../../model/categoryList'
import { mapGetters } from 'vuex'
import upload from '../../../utils/file/upload'
import TransportItem from '../MainPage/TransportItem.vue'
import { uploadQueue } from '../../../api/Transport/TransportQueue'
import { EventBus, EventType } from '../../../utils/eventBus'

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
      state: 0
    }
  },
  created () {
    this.resetSelected()
    this.getListData()
    this.observerEventBus()
  },
  methods: {
    observerEventBus () {
      const myThis = this as any
      EventBus.$on('fileFinished', (task, fileInfo) => {
        console.log(task);
        console.log(fileInfo);
      })
      EventBus.$on('progress', index => {
        console.log(index);
      })
    },
    // handle views action
    handleCategoryChange (index: number) {  // 切换"正在上传"、"上传完成"
      this.state = index
      this.getListData()
    },
    handleOperateAction (command: string) {
      const _this = this as any
      switch (command) {
        case 'pauseAll':  // 全部暂停
          let pauseCount = 0
          // this.uploadInfo.forEach(item => {
          //   if (item.state === 'progressing') {
          //     pauseCount++
          //     item.state = 'interrupted'
          //     upload.prepareFile(item, { data: '', add: file => {}, success: (file, rs) => {} });
          //   }
          // })
          if (pauseCount === 0) {
            _this.$message.warning('无可暂停任务')
          }
          break;
        case 'resumeAll':  // 全部开始
          let resumeCount = 0
          // this.uploadInfo.forEach(item => {
          //   if (item.state === 'interrupted') {
          //     resumeCount++
          //     item.state = 'progressing'
          //     upload.prepareFile(item, { data: '', add: file => {}, success: (file, rs) => {} });
          //   }
          // })
          if (resumeCount === 0) {
            _this.$message.warning('无可开始任务')
          }
          break;
        case 'cancelAll': // 全部取消
          let cancelCount = 0
          // this.uploadInfo.forEach((item, index, self) => {
          //   if (item.state === 'progressing' || item.state === 'interrupted') {
          //     cancelCount++
          //     self.splice(index, 1)
          //   }
          // })
          if (cancelCount === 0) {
            _this.$message.warning('无可取消任务')
          } else {
            setTimeout(() => { _this.getListData() }, 1000);
          }
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
    handleControl(model, ...args: any[]) {
      const _this = this as any
      switch (args[0]) {
        case 'deleteFile':  // 删除文件
          _this.deleteFile(model)
          break;
        case 'refresh': // 刷新
          _this.getListData()
          break;
        case 'cancel':  // 取消
          // const index = _this.uploadInfo.map(o => o.name).indexOf(model.name)
          // _this.uploadInfo.splice(index, 1)
          setTimeout(() => {
            _this.getListData()
          }, 1000);
          break;
        case 'pause': // 暂停 开始
          model.state = model.state === 'interrupted' ? 'progressing' : 'interrupted';
          upload.prepareFile(model, { data: '', add: file => {}, success: (file, rs) => {} });
          break;
        default:
          break;
      }
    },
    clearAllTrans() { // 清空所有记录
      const _this = this as any
      // if (_this.uploadInfo.length === 0) {
      //   _this.$message.warning('当前无记录')
      //   return
      // }
      _this.$electron.shell.beep()
      _this.$confirm({
        title: '删除',
        content: '是否将所所有记录清空',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          _this.$store.dispatch('Transform/updateTransUploadInfo', [])
          _this.$store.dispatch('Transform/saveTransUploadInfo') // 清空后要更新缓存，不然下次进来可能有问题
          _this.getListData()
        }
      });
    },
    getListData () {
      const list = uploadQueue.getAllTasks()
      console.log(JSON.parse(JSON.stringify(list)));
      uploadCategorys[0].count = list.filter(item => (item.status === 0 || item.status === 1 || item.status === 3)).length  // 正在上传
      uploadCategorys[1].count = list.filter(item => item.status === 2).length  // 上传完成
      if (this.state === 0) {
        this.dataArray = list.filter(item => item.status === 0 || item.status === 1 || item.status === 3)
      } else {
        this.dataArray = list.filter(item => item.status === 2)
      }
    },
    // inner private methods
    handleItemAction(command: string, ...args: any[]) {
      console.log(command);
      const item:any = this.dataArray[args[0]]
      console.log(item);
      const _this = this as any
      switch (command) {
        case 'cancel':  // 取消
          let deleteList = _this.backupInfo
          const index = deleteList.map(o => o.foldName).indexOf(item.srcPath)
          deleteList.splice(index, 1)
          _this.$store.dispatch('Transform/updateTransBackupInfo', deleteList)
          setTimeout(() => {
            _this.getListData()
          }, 1000);
          break;
        case 'pause': // 暂停 开始
          item.state = item.state === 'interrupted' ? 'progressing' : 'interrupted';
          // uploadBackup.prepareFile(item, { data: this.hostname + ClientAPI.getMac(), add: file => {}, success: (file, rs) => { _this.getListData() } });
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
          _this.deleteFile(item)
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
