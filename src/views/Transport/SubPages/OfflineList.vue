<template>
  <div class="offline-list">
    <main-page
      :loading="loading"
      :totalSize="totalSize"
      :categorys="categorys"
      :dataSource="showArray"
      v-on:itemAction="handleItemAction"
      v-on:categoryChange="handleCategoryChange"
      v-on:batchAction="handleOperateAction"
      v-on:loadMore="handleLoadMoreAction"
    />
    <new-offline-modal v-if="showNewModal" v-on:dismiss="handleModalDismiss"/>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import NewOfflineModal from '../MainPage/NewOfflineModal.vue'
import { TransportModel, offlineCategorys } from '../MainPage/TransportModel'
import NasFileAPI from '../../../api/NasFileAPI'
import { OfflineTask, OfflineTaskStatus } from '../../../api/NasFileModel'
import TransportHandler from '../TransportHandler'
import { BasicResponse } from '../../../api/UserModel'
import { AxiosResponse } from 'axios'

export default Vue.extend({
  name: 'offline-list',
  components: {
    MainPage,
    NewOfflineModal
  },
  data () {
    return {
      page: 1,
      busy: false,
      loading: false,
      totalSize: 0,
      showNewModal: false,
      dataArray: [] as TransportModel[],
      showArray: [] as TransportModel[],
      categorys: _.cloneDeep(offlineCategorys)
    }
  },
  created () {
    this.fetchOfflineList()
  },
  methods: {
    // action methods
    handleCategoryChange (aIndex: number) {  // 切换"正在下载"、"下载完成"
      this.categorys = this.categorys.map((item, index) => {
        item.isSelected = index === aIndex
        return item
      })
    },
    handleOperateAction (command: string) {
      switch (command) {
        case 'newOffline':
          this.showNewModal = true
          break
        case 'pauseAll':
          this.pauseAllTask()
          break
        case 'continue':
          this.continueAllTask()
          break
        case 'cancelAll':
          this.cancelDoingTasks()
          break;
        case 'clearAll':
          this.clearDoneTasks()
          break
      }
    },
    handleItemAction (command: string, index: number, ...args: any[]) {
      const model = this.dataArray[index]
      switch (command) {
        case 'delete':
        case 'cancel':
          break
        case 'pause':
          this.pauseTask(model.id)
          break
        case 'continue':
          break
        case 'refresh':
          break
        case 'jump':
          break
        case 'open':
          break
        case 'openInFinder':
          break
        default:
          break
      }
    },
    handleLoadMoreAction () {
      this.page++
      this.fetchOfflineList()
    },
    // private methods
    fetchOfflineList () {
      this.loading = true
      NasFileAPI.fetchOfflineList(this.page).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        let list = _.get(response.data.data, 'list') as OfflineTask[]
        if (_.isEmpty(list) || list.length < 40) this.busy = true
        const newList = list.map(item => {
          return TransportHandler.convertOfflineTask(item)
        })
        this.dataArray = this.page === 1 ? newList : this.dataArray.concat(newList)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    handleModalDismiss () {
      this.showNewModal = false
      this.refreshListData()
    },
    refreshListData () {
      this.busy = false
      this.page = 1
      this.fetchOfflineList()
    },
    // batch operations
    pauseAllTask () {
      this.loading = true
      const status = OfflineTaskStatus.running | OfflineTaskStatus.prepare | OfflineTaskStatus.ready
      NasFileAPI.pauseOfflineTask(undefined, status).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '全部暂停失败')
      })
    },
    continueAllTask () {
      this.loading = true
      const status = OfflineTaskStatus.pausing
      NasFileAPI.resumeOfflineTask(undefined, status).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '全部继续失败')
      })
    },
    cancelDoingTasks () {
      this.loading = true
      const status = OfflineTaskStatus.pausing | OfflineTaskStatus.running | OfflineTaskStatus.prepare | OfflineTaskStatus.ready | OfflineTaskStatus.error
      NasFileAPI.resumeOfflineTask(undefined, status).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '全部取消失败')
      })
    },
    clearDoneTasks () {
      this.loading = true
      const status = OfflineTaskStatus.completed
      NasFileAPI.resumeOfflineTask(undefined, status).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '全部删除失败')
      })
    },
    // single operations
    pauseTask (id: number) {
      
    },
    handleRequestSuccess (response: AxiosResponse<BasicResponse>) {
      console.log(response)
      this.loading = false
      if (response.data.code !== 200) return
      this.refreshListData()
    },
    handleRequestError (error: any, tip: string) {
      console.log(error)
      this.loading = false
      this.$message.error(tip)
    }
  }
})
</script>

<style lang="less" scoped>
.offline-list {
  height: 100%;
  width: 100%;
}
</style>
