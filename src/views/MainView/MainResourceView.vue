<template>
  <main-view
    ref="mainView"
    :currentPath="currentPath"
    :loading="loading"
    :dataSource="dataArray"
    :busy="busy"
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
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import { ResourceItem, OrderType } from '../../api/NasFileModel'
import NasFileAPI, { TaskMode } from '../../api/NasFileAPI'
import { BasicResponse, User } from '../../api/UserModel'
import ResourceHandler from './ResourceHandler'
import { ClipboardModel } from '../../store/modules/Resource'
import { uploadQueue } from '../../api/TransportQueue'
import { UploadTask } from '../../api/UploadTask'
import { resourceContextMenu } from '../../components/OperateListAlter/operateList'

export default Vue.extend({
  name: 'main-resource-view',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    let items: Array<ResourceItem> = []
    return {
      loading: false,
      currentPath: '',
      dataArray: items,
      showArray: items,
      page: 1,
      busy: false,
      order: OrderType.byNameDesc, // 当前选择的排序规则
      resourceContextMenu, // item的右键菜单数据
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('Resource', ['clipboard']),
    path: function () {
      const path = this.$route.query.path as string
      return path
    },
    uuid: function () {
      const uuid = this.$route.query.uuid as string
      return uuid
    }
  },
  watch: {
    $route: {
      handler: function () {
        if (this.$route.name !== 'main-resource-view') return
        this.updateView()
      }
    }
  },
  created () {
    this.updateView()
  },
  methods: {
    updateView () {
      if (this.checkParams()) this.updateShowPath()
      if (this.checkQuery()) this.fetchResourceList()
    },
    checkQuery () {
      const path = this.$route.query.path
      const uuid = this.$route.query.uuid
      const result = _.isEmpty(path) && !_.isEmpty(uuid)
      return !result
    },
    checkParams () {
      const showPath = this.$route.params.showPath
      const result = _.isEmpty(showPath)
      return !result
    },
    fetchResourceList () {
      this.loading = true
      NasFileAPI.fetchResourceList(this.path, this.uuid, this.page, 20, this.order).then(response => {
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
    updateShowPath () {
      this.currentPath = this.$route.params.showPath
    },
    parseResponse (data: BasicResponse) {
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < 20) this.busy = true
      list = ResourceHandler.formateResponseList(list)
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    handlePasteSuccess () {
      this.$message.info('粘贴任务添加成功')
      const isClip = (this.clipboard as ClipboardModel).isClip
      if (isClip) this.$store.dispatch('Resource/updateClipboard', { isClip: false, items: [] })
      this.$store.dispatch('Resource/increaseTask')
    },
    // 覆盖混入中的方法
    handleBackAction () {
      this.$router.go(-1)
      // update current path
      const index = this.currentPath.lastIndexOf('/')
      this.currentPath = this.currentPath.slice(0, index)
      // TODO: 还没有初始化分类栏
    },
    handleloadMoreData () {
      if (this.busy) return
      this.page++
      this.fetchResourceList()
    },
    handleRefreshAction () {
      this.page = 1
      this.busy = false
      this.fetchResourceList()
    },
    handleUploadAction (filePaths: string[]) {
      filePaths.forEach(path => {
        const task = new UploadTask(path, this.path, this.uuid)
        uploadQueue.addTask(task)
      })
    },
    handleNewFolderAction () {

    },
    handleSortWayChangeAction (order: OrderType) {
      this.page = 1
      this.busy = false
      this.order = order
      this.fetchResourceList()
    },
    handleSearchAction (keyword: string) {
      this.loading = true
      const prefix = `/.ugreen_nas/${(this.user as User).ugreenNo}`
      const uuid = this.$route.query.uuid as string
      let path = this.$route.query.path as string
      path = path.substring(prefix.length, path.length)
      path = path.length === 0 ? '/' : path
      NasFileAPI.searchFile(uuid, path, keyword).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'list') as Array<ResourceItem>
        this.dataArray = ResourceHandler.formateResponseList(list)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    handlePasteAction (mode: TaskMode) {
      const srcItems = ResourceHandler.getSelectItems(this.showArray)
      const dstItem = { path: this.path, uuid: this.uuid } as ResourceItem
      NasFileAPI.addMoveTask(srcItems, dstItem, mode).then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        this.handlePasteSuccess()
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    }
  }
})
</script>
