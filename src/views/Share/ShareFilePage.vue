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
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import { ResourceItem, ShareItem } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import ResourceHandler from '../MainView/ResourceHandler'
import { shareContextMenu } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'
import { User } from '@/api/UserModel'

export default Vue.extend({
  name: 'share-file-page',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
      dataArray: [] as ResourceItem[]
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ugreenNo: function () {
      const ugreenNo = this.$route.query.ugreenNo as string
      return ugreenNo
    },
    isSelf: function () {
      const isSelf = (this.ugreenNo === (this.user as User).ugreenNo.toString()) as boolean
      return isSelf
    },
    itemMenu: function () {
      const isSelf = this.ugreenNo === (this.user as User).ugreenNo.toString()
      let itemMenu = _.cloneDeep(shareContextMenu)
      if (isSelf) return itemMenu
      const disableCommands = ['delete', 'rename', 'unshare', 'jump']
      itemMenu = itemMenu.map(group => {
        const items = group.items.map(item => {
          item.disable = disableCommands.indexOf(item.command) !== -1
          return item
        })
        group.items = items
        return group
      })
      return itemMenu
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
          return ResourceHandler.convertResourceItem(item) as ResourceItem
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    // 覆盖混入中的方法
    handleRefreshAction () {
      this.fetchShareFileList()
    },
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      const isSelf = this.isSelf ? 'true' : 'false'
      RouterUtility.push(item.name, 'share-resource-view', { path, uuid }, { isSelf })
    },
    handleUnshareAction () {
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      NasFileAPI.cancelShare(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('取消成功')
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
      }).catch(_ => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('取消失败')
      })
    }
  }
})
</script>
