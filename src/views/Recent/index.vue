<template>
  <main-view
    :busy="busy"
    :count="totalSize"
    :loading="loading"
    :dataSource="dataArray"
    :popoverList="uploadSortList"
    :contextItemMenu="recentContextMenu"
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
import { ResourceItem, OrderType, UploadTimeSort } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import { BasicResponse } from '@/api/UserModel'
import { uploadSortList } from '@/model/sortList'
import ResourceHandler from '../MainView/ResourceHandler'
import MainViewMixin from '../MainView/MainViewMixin'
import { recentContextMenu } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'

export default Vue.extend({
  name: 'recent',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    return {
      page: 1,
      busy: false,
      totalSize: 0,
      loading: false,
      uploadSortList,
      dataArray: [] as ResourceItem[],
      uploadOrder: UploadTimeSort.descend, // 上传列表的排序方式
      recentContextMenu // item右键菜单
    }
  },
  mounted () {
    this.handleRefreshAction()
  },
  methods: {
    fetchUlist () {
      this.loading = true
      const pos = this.getPositionValue()
      NasFileAPI.fetchUlist(this.page, pos, this.uploadOrder).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    getPositionValue () {
      if (this.page < 2) return 0
      const lastItem = _.last(this.dataArray)
      const pos = lastItem === undefined ? 0 : lastItem.utime
      return pos
    },
    parseResponse (data: BasicResponse) {
      this.totalSize = _.get(data.data, 'total')
      let ulist = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(ulist) || ulist.length < 20) this.busy = true
      ulist = ResourceHandler.formatResourceList(ulist)
      ulist = this.page === 1 ? ulist : this.dataArray.concat(ulist)
      this.dataArray = ulist.map((item, index) => {
        item.index = index
        return item
      })
    },
    // 重写父类中的方法
    handleRefreshAction () {
      this.page = 1
      this.busy = false
      this.fetchUlist()
    },
    handleLoadmoreAction () {
      this.page++
      this.fetchUlist()
    },
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(item.name, 'recent-resource-view', { path, uuid })
    },
    handleSortWayChangeAction (order: OrderType) {
      if (order === OrderType.ByUploadDesc) {
        this.uploadOrder = UploadTimeSort.descend
      } else if (order === OrderType.ByUploadAsc) {
        this.uploadOrder = UploadTimeSort.ascend
      }
      this.page = 1
      this.busy = false
      this.fetchUlist()
    }
  }
})
</script>

<style lang="less" scoped>

</style>
