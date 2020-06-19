<template>
  <main-view
    :busy="busy"
    :loading="loading"
    :dataSource="dataArray"
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
import { ResourceItem, OrderType, ResourceType } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'
import ResourceHandler from '../MainView/ResourceHandler'

export default Vue.extend({
  name: 'media',
  mixins: [MainViewMixin],
  components: {
    MainView
  },
  data () {
    return {
      loading: false,
      busy: false,
      page: 1,
      dataArray: [] as ResourceItem[],
      order: OrderType.byNameDesc // 当前选择的排序规则
    }
  },
  watch: {
    $route: {
      handler: function () {
        this.updateView()
      }
    }
  },
  computed: {
    type: function () {
      switch (this.$route.name) {
        case 'media-image':
          return ResourceType.image
        case 'media-video':
          return ResourceType.video
        case 'media-music':
          return ResourceType.audio
        case 'media-document':
          return ResourceType.document
        default:
          return undefined
      }
    }
  },
  mounted () {
    this.updateView()
  },
  methods: {
    updateView () {
      if (this.type !== undefined) this.fetchMediaList()
    },
    fetchMediaList () {
      this.loading = true
      let utime = 0
      const lastItem = _.last(this.dataArray)
      if (this.page > 1 && lastItem !== undefined) {
        utime = lastItem.utime
      }
      NasFileAPI.fetchTlist(this.page, utime, this.type!, this.order).then(response => {
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
    parseResponse (data: BasicResponse) {
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < 39) this.busy = true
      list = ResourceHandler.formatResourceList(list)
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    // 覆盖混入中的方法
    handleLoadmoreAction () {
      this.page++
      this.fetchMediaList()
    },
    handleRefreshAction () {
      this.fetchMediaList()
    },
    handleSortWayChangeAction (order: OrderType) {
      this.page = 1
      this.busy = false
      this.order = order
      this.fetchMediaList()
    }
  }
})
</script>

<style lang="less" scoped>

</style>
