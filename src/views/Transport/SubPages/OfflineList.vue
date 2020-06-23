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
import { OfflineTask } from '../../../api/NasFileModel'
import TransportHandler from '../TransportHandler'
import { BasicResponse } from '../../../api/UserModel'

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
      this.busy = false
      this.page = 1
      this.fetchOfflineList()
    },
    // handle views action
    handleCategoryChange (index: number) {  // 切换"正在下载"、"下载完成"
      
    },
    handleOperateAction (command: string) {
      switch (command) {
        case 'newOffline':
          this.showNewModal = true
          break
        case 'pauseAll':
          break
        case 'continue':
          break
        case 'cancelAll':
          break;
        case 'clearAll':
          break
      }
    },
    handleItemAction (command: string, index: number, ...args: any[]) {

    },
    handleLoadMoreAction () {
      this.page++
      this.fetchOfflineList()
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
