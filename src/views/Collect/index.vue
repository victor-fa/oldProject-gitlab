<template>
  <main-view
    :loading="loading"
    :dataSource="dataArray"
    :contextItemMenu="itemMenu"
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
import { CollectItem, ResourceItem } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import ResourceHandler from '../MainView/ResourceHandler'
import { collectContextMenu } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'

export default Vue.extend({
  name: 'collect',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
      dataArray: [] as ResourceItem[],
      itemMenu: _.cloneDeep(collectContextMenu) // item的右键菜单列表数据
    }
  },
  mounted () {
    this.fetchCollectList()
  },
  methods: {
    fetchCollectList () {
      this.loading = true
      NasFileAPI.fetchCollectList().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'files')
        this.dataArray = list.map((item, index) => {
          return ResourceHandler.convertResourceItem(item) as ResourceItem
        })
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    // 重写混入中的方法
    handleRefreshAction () {
      this.fetchCollectList()
    },
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(item.name, 'collect-resource-view', { path, uuid })
    },
    handleUnCollectAction () {
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      NasFileAPI.cancelShare(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('取消成功')
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
      }).catch(error => {
        console.log(error)
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('取消失败')
      })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
