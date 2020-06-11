<template>
  <main-view
    :loading="loading"
    :busy="busy"
    :dataSource="dataArray"
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
import NasFileAPI from '@/api/NasFileAPI'
import ResourceHandler from '../MainView/ResourceHandler'
import { recycleContextMenu, recycleListContextMenu } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'

export default Vue.extend({
  name: 'recycle',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    return {
      busy: false,
      loading: false,
      order: OrderType.byNameDesc, // 提供给子类使用
      dataArray: [] as ResourceItem[],
      total: 0,
      itemMenu: recycleContextMenu,
      listMenu: recycleListContextMenu
    }
  },
  mounted () {
    this.fetchRecycleList()
  },
  methods: {
    fetchRecycleList () {
      this.loading = true
      NasFileAPI.fetchRecycleList().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.total = _.get(response.data.data, 'total')
        const list = _.get(response.data.data, 'list')
        this.dataArray = ResourceHandler.formatResourceList(list).map(item => {
          item.name = item.alias
          return item
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    showDeleteDialog (items: ResourceItem[]): Promise<number> {
      return new Promise((resolve, reject) => {
        const { dialog } = require('electron').remote
        const message = items.length > 1 ? `你确定要永久删除所选的${items.length}个项目吗？` : `你确定要永久删除”${items[0].name}“吗？`
        setTimeout(() => {
          dialog.showMessageBox({
            type: 'info',
            message,
            buttons: ['删除', '取消'],
            cancelId: 1
          }).then(result => {
            resolve(result.response)
          }).catch(error => {
            reject(error)
          })
        }, 100);
      })
    },
    // 覆盖混入中的方法
    handleRefreshAction () {
      this.fetchRecycleList()
    },
    handleOpenFolderAction (item: ResourceItem) {
      // const path = item.path
      // const uuid = item.uuid
      // RouterUtility.push(item.name, 'recycle-resource-view', { path, uuid })
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
      this.showDeleteDialog(items).then(result => {
        if (result === 1) return
        this.handleDeletRequest(items)
      })
    },
    handleClearTrashAction () {
      this.handleDeletRequest(this.dataArray)
    },
    handleDeletRequest (items: ResourceItem[]) {
      this.loading = true
      NasFileAPI.addDeleteTask(items).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
        this.$store.dispatch('Resource/increaseTask')
      }).catch(_ => {
        this.$message.error('删除失败')
        this.loading = false
      })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
