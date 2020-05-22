<template>
  <main-view
    :loading="loading"
    :dataSource="dataArray"
    :contextListMenu="backupContextMenu"
    :contextItemMenu="backupResourceContextMenu"
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
import { BasicResponse } from '../../api/UserModel'
import { ResourceItem, OrderType, UploadTimeSort } from '../../api/NasFileModel'
import ResourceHandler from '../MainView/ResourceHandler'
import NasFileAPI from '../../api/NasFileAPI'
import { backupContextMenu, backupResourceContextMenu } from '../../components/OperateListAlter/operateList'
import UploadTask from '../../api/Transport/UploadTask'

export default Vue.extend({
  name: 'backup',
  components: {
    MainView
  },
  mounted () {
    this.fetchBackupList()
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
      dataArray: [] as ResourceItem[],
      page: 1,
      uploadOrder: UploadTimeSort.descend, // 上传列表的排序方式
      busy: false,
      backupContextMenu, // list右键菜单选项
      backupResourceContextMenu // item右键菜单选项
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
  methods: {
    fetchBackupList () {
      this.loading = true
      NasFileAPI.fetchBackuplist().then(response => {
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
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < 20) this.busy = true
      list = ResourceHandler.formatResourceList(list)
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    // 重写父类中的方法
    handleRefreshAction () {
      this.page = 1
      this.busy = false
      this.fetchBackupList()
    },
    handleLoadmoreAction () {
      this.page++
      this.fetchBackupList()
    },
    handleSortWayChangeAction (order: OrderType) {
      if (order === OrderType.ByUploadDesc) {
        this.uploadOrder = UploadTimeSort.descend
      } else if (order === OrderType.ByUploadAsc) {
        this.uploadOrder = UploadTimeSort.ascend
      }
      this.page = 1
      this.busy = false
      this.fetchBackupList()
    }
  }
})
</script>

<style scoped>

</style>
