<template>
  <main-view
    :loading="loading"
    :dataSource="dataArray"
    :contextItemMenu="shareContextMenu"
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
import { ResourceItem, ShareItem } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import ResourceHandler from '../MainView/ResourceHandler'
import { shareContextMenu } from '../../components/OperateListAlter/operateList'

export default Vue.extend({
  name: 'share-file-page',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    let items: Array<ResourceItem> = []
    return {
      loading: false,
      dataArray: items,
      shareContextMenu // item的右键菜单列表数据
    }
  },
  computed: {
    ugreenNo: function () {
      return this.$route.query.ugreenNo as string
    }
  },
  mounted () {
    if (this.checkQuery()) {
      this.fetchShareFileList()
    }
  },
  methods: {
    checkQuery () {
      if (_.isEmpty(this.ugreenNo)) {
        this.$message.error(`缺少ugreenNo参数`)
        return false
      }
      return true
    },
    fetchShareFileList () {
      this.loading = true
      NasFileAPI.fetchShareFileList(this.ugreenNo).then(response => {
        this.loading = false
        console.log(response)
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'files') as Array<ShareItem>
        this.dataArray = list.map((item, index) => {
          const rItem = ResourceHandler.convertResourceItem(item) as ResourceItem
          rItem.index = index
          return rItem
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    // 移除取消的item
    removeItems (items: ResourceItem[]) {
      this.dataArray = this.dataArray.filter(item => {
        return !item.isSelected
      })
    },
    // 覆盖混入中的方法
    handleRefreshAction () {
      this.fetchShareFileList()
    },
    handleUnshareAction () {
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      NasFileAPI.cancelShare(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('取消成功')
        this.removeItems(items)
      }).catch(_ => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('取消失败')
      })
    }
  }
})
</script>
