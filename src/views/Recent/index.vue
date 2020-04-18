<template>
  <main-view
    currentPath="最近"
    :loading="loading"
    :dataSource="dataArray"
    :busy="busy"
    :popoverList="uploadSortList"
    :contextItemMenu="resourceContextMenu"
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
import { ResourceItem, OrderType, UploadTimeSort } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'
import { uploadSortList } from '../../model/sortList'
import ResourceHandler from '../MainView/ResourceHandler'
import MainViewMixin from '../MainView/MainViewMixin'
import { resourceContextMenu } from '../../components/OperateListAlter/operateList'

export default Vue.extend({
  name: 'recent',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
      dataArray: [] as ResourceItem[],
      page: 1,
      busy: false,
      uploadSortList,
      uploadOrder: UploadTimeSort.descend, // 上传列表的排序方式
      resourceContextMenu // item右键菜单
    }
  },
  mounted () {
    this.handleRefreshAction()
  },
  methods: {
    fetchUlist () {
      this.loading = true
      NasFileAPI.fetchUlist(this.page, this.uploadOrder).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    parseResponse (data: BasicResponse) {
      let ulist = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(ulist) || ulist.length < 20) this.busy = true
      ulist = ResourceHandler.formateResponseList(ulist)
      this.dataArray = this.page === 1 ? ulist : this.dataArray.concat(ulist)
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
