<template>
  <main-view
    ref="mainView"
    :currentPath="currentPath"
    :loading="loading"
    :dataSource="dataArray"
    :busy="busy"
    :contextItemMenu="itemContextMenu"
    :contextListMenu="listContextMenu"
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
import { ResourceItem, OrderType, ResourceType } from '../../api/NasFileModel'
import NasFileAPI, { TaskMode } from '../../api/NasFileAPI'
import { BasicResponse, User } from '../../api/UserModel'
import ResourceHandler from './ResourceHandler'
import { ClipboardModel } from '../../store/modules/Resource'
import { uploadQueue } from '../../api/Transport/TransportQueue'
import UploadTask from '../../api/Transport/UploadTask'
import { resourceContextMenu, listContextMenu } from '../../components/OperateListAlter/operateList'
import StringUtility from '../../utils/StringUtility'
import processCenter, { EventName } from '../../utils/processCenter'

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
      itemContextMenu: resourceContextMenu, // item的右键菜单
      listContextMenu // list的右键菜单
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
    },
    selectedPath: function () { // 标记选中的item(用于跳转到文件的功能)
      const selectedPath = this.$route.params.selectedPath as string
      return selectedPath
    }
  },
  watch: {
    $route: {
      handler: function () {
        if (!this.handleRouteChange()) return
        this.updateView()
      }
    }
  },
  created () {
    this.updateView()
  },
  methods: {
    // 处理路由改变，判断当前是否需要更新界面
    handleRouteChange () {
      return this.$route.name === 'main-resource-view'
    },
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
      list = ResourceHandler.formatResourceList(list, this.selectedPath)
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
      this.currentPath = StringUtility.pathDirectory(this.currentPath)
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
        this.$store.dispatch('Resource/increaseTask')
      })
    },
    handleNewFolderAction () {
      const newName = this.newFolderName()
      const newItem = {
        type: ResourceType.folder,
        name: newName,
        renaming: true
      } as ResourceItem
      this.dataArray.unshift(newItem)
    },
    // 计算新建文件夹名称
    newFolderName (name: string = '新建文件夹') {
      for (let index = 0; index < this.dataArray.length; index++) {
        const element = this.dataArray[index]
        if (element.name === name) {
          let count = Number(name.substring(5, name.length))
          count = count === 0 ? 2 : count + 1
          return this.newFolderName(`新建文件夹${count}`)
        }
      }
      return name
    },
    handleNewFolderRequestAction (index: number, newName: string) {
      // TODO: 当前没有对目录名合法性进行校验
      const item = ResourceHandler.disableRenamingItem(this.dataArray)
      if (item === undefined) return
      const directory = `${this.path}/${newName}`
      NasFileAPI.newFolder(directory, this.uuid, newName).then(response => {
        this.handleNewFolderSuccess(response.data.code, item, newName)
      }).catch(error => {
        console.log(error)
        this.$message.error('创建失败')
        this.dataArray.splice(0, 1)
      })
    },
    handleNewFolderSuccess (code: number, item: ResourceItem, newName: string) {
      if (code !== 200) {
        this.dataArray.splice(0, 1)
      } else {
        item.disable = false
        item.renaming = false
        item.uuid = this.uuid
        item.name = newName
        item.path = `${this.path}/${newName}`
        this.dataArray.splice(0, 1, item)
        this.$message.info('新建成功')
      }
    },
    handleDireactoryInfoAction () {
      processCenter.renderSend(EventName.mediaInfo, {
        path: 'media-info',
        params: {
          uuid: this.uuid,
          path: this.path
        }
      })
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
