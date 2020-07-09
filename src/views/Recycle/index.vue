<template>
  <main-view
    :busy="busy"
    :count="totalSize"
    :loading="loading"
    :adjust="123"
    :showToolbars="[]"
    :dataSource="dataArray"
    :funcList="showFuncList"
    :contextItemMenu="itemMenu"
    :contextListMenu="listMenu"
    v-on:headerCallbackActions="handleHeaderActions"
    v-on:listCallbackActions="handleListActions"
    v-on:itemCallbackActions="handleItemActions"
    v-on:contextMenuCallbackActions="handleContextMenuActions"
  />
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import { ResourceItem, OrderType } from '@/api/NasFileModel'
import NasFileAPI, { maxSize } from '@/api/NasFileAPI'
import ResourceHandler from '../MainView/ResourceHandler'
import { recycleContextMenu, recycleListContextMenu } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'
import { BasicResponse } from '../../api/UserModel'
import { backupFunList } from '../MainView/ResourceFuncList'

export default Vue.extend({
  name: 'recycle',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    return {
      page: 1,
      totalSize: 0,
      busy: false,
      loading: false,
      order: OrderType.byNameDesc, // 提供给子类使用
      dataArray: [] as ResourceItem[],
      itemMenu: recycleContextMenu,
      listMenu: recycleListContextMenu,
      showFuncList: _.cloneDeep(backupFunList)
    }
  },
  mounted () {
    this.fetchRecycleList()
  },
  methods: {
    fetchRecycleList () {
      this.loading = true
      NasFileAPI.fetchRecycleList(this.page).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    parseResponse (data: BasicResponse) {
      this.totalSize = _.get(data.data, 'total')
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < maxSize) this.busy = true
      list = ResourceHandler.formatResourceList(list).map(item => {
        item.name = item.alias
        return item
      })
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    showDeleteDialog (message: string): Promise<number> {
      return new Promise((resolve, reject) => {
        const { dialog } = require('electron').remote
        dialog.showMessageBox({
					title: '绿联云',
          type: 'info',
          message,
          buttons: ['删除', '取消'],
          cancelId: 1
        }).then(result => {
          resolve(result.response)
        }).catch(error => {
          reject(error)
        })
      })
    },
    handleDeletRequest (items: ResourceItem[]) {
      this.loading = true
      NasFileAPI.addDeleteTask(items).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
        this.$store.dispatch('Resource/increaseTask')
      }).catch(error => {
        console.log(error)
        this.$message.error('删除失败')
        this.loading = false
      })
    },
    handleClearRequest () {
      this.loading = true
      NasFileAPI.clearRecycle().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.dataArray = []
        this.$message.info('回收站已清空')
      }).catch(error => {
        console.log(error)
        this.$message.error('清空失败')
        this.loading = false
      })
    },
    // 覆盖混入中的方法
    handleRefreshAction () {
      this.page = 1
      this.busy = true
      this.fetchRecycleList()
    },
    handleLoadmoreAction () {
      this.page++
      this.fetchRecycleList()
    },
    handleRecoveryAction () {
      const items = ResourceHandler.getSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      this.loading = true
      NasFileAPI.recoveryFile(items).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络错误')
      })
    },
    handleDeletAction () {
      const items = ResourceHandler.getSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      const message = items.length > 1 ? `您确定要永久删除所选的${items.length}个项目吗？` : `您确定要永久删除”${items[0].name}“吗？`
      this.showDeleteDialog(message).then(result => {
        if (result === 1) return
        this.handleDeletRequest(items)
      })
    },
    handleClearTrashAction () {
      if (_.isEmpty(this.dataArray)) return
      const message = '您确定要清空回收站吗？'
      this.showDeleteDialog(message).then(result => {
        if (result === 1) return
        this.handleClearRequest()
      })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
