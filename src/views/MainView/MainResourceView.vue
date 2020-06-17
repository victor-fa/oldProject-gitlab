<template>
  <main-view
    ref="mainView"
    :loading="loading"
    :dataSource="dataArray"
    :busy="busy"
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
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import { ResourceItem, OrderType, ResourceType } from '@/api/NasFileModel'
import NasFileAPI, { TaskMode } from '@/api/NasFileAPI'
import { BasicResponse, User } from '@/api/UserModel'
import ResourceHandler from './ResourceHandler'
import { ClipboardModel } from '../../store/modules/Resource'
import { uploadQueue } from '../../api/Transport/TransportQueue'
import UploadTask from '../../api/Transport/UploadTask'
import { resourceContextMenu, listContextMenu } from '../../components/OperateListAlter/operateList'
import StringUtility from '../../utils/StringUtility'
import processCenter, { EventName } from '../../utils/processCenter'
import { TaskError } from '../../api/Transport/BaseTask'

export default Vue.extend({
  name: 'main-resource-view',
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
      categoryType: ResourceType.all,
      order: OrderType.byNameDesc, // 当前选择的排序规则
      itemMenu: resourceContextMenu, // item的右键菜单
      listMenu: listContextMenu // list的右键菜单
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
        this.updateView()
      }
    }
  },
  created () {
    this.updateView()
  },
  destroyed () {
    uploadQueue.off('taskFinished', this.handleTaskFinished)
    uploadQueue.off('error', this.handleTaskError)
  },
  methods: {
    updateView () {
      if (this.checkQuery()) this.fetchResourceList()
      const mainView = this.$refs.mainView as any
      mainView !== undefined && mainView.resetHeaderView()
    },
    checkQuery () {
      if (_.isEmpty(this.path) || _.isEmpty(this.uuid)) {
        return false
      }
      return true
    },
    fetchResourceList () {
      if (this.categoryType === ResourceType.all) {
        this.fetchAllList()
      } else {
        this.fetchTypeList(this.categoryType)
      }
    },
    fetchAllList () {
      this.loading = true
      NasFileAPI.fetchResourceList(this.path, this.uuid, this.page, this.order).then(response => {
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
    fetchTypeList (type: ResourceType) {
      this.loading = true
      let utime = 0
      const lastItem = _.last(this.dataArray)
      if (this.page > 1 && lastItem !== undefined) {
        utime = lastItem.utime
      }
      NasFileAPI.fetchTlist(this.page, utime, type, this.order).then(response => {
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
      list = ResourceHandler.formatResourceList(list, this.selectedPath)
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    handlePasteSuccess () {
      this.$message.info('粘贴任务添加成功')
      const isClip = (this.clipboard as ClipboardModel).isClip
      if (isClip) this.$store.dispatch('Resource/updateClipboard', { isClip: false, items: [] })
      this.$store.dispatch('Resource/increaseTask')
      this.handleRefreshAction()
    },
    // 覆盖混入中的方法
    handleLoadmoreAction () {
      if (this.busy) return
      this.page++
      this.fetchResourceList()
    },
    handleRefreshAction () {
      this.page = 1
      this.busy = false
      this.fetchResourceList()
    },
    handleDropAction (paths: string[]) {
      this.handleUploadAction(paths)
    },
    handleUploadAction (filePaths: string[]) {
      filePaths.forEach(path => {
        console.log(path);
        const task = new UploadTask(path, this.path, this.uuid)
        uploadQueue.addTask(task)
        uploadQueue.once('taskFinished', this.handleTaskFinished)
        uploadQueue.once('error', this.handleTaskError)
        this.$store.dispatch('Resource/increaseTask')
      })
    },
    handleTaskFinished () {
      setTimeout(() => {
        this.handleRefreshAction()
      }, 1000)
    },
    handleTaskError (taskId: number, error: TaskError) {
      this.$message.error(error.desc)
    },
    handleNewFolderAction () {
      const newName = ResourceHandler.calculateNewFolderName(this.dataArray)
      const newItem = {
        type: ResourceType.folder,
        isSelected: true,
        name: newName,
        renaming: true
      } as ResourceItem 
      this.dataArray = [newItem].concat(this.dataArray).map((item, index) => {
        item.index = index
        return item
      })
    },
    handleNewFolderRequestAction (index: number, newName: string) {
      if (!ResourceHandler.checkFileName(newName)) {
        this.$message.error('名称包含非法字符')
        return
      }
      const item = this.updateItemState(index, true, false)
      const directory = `${this.path}/${newName}`
      NasFileAPI.newFolder(directory, this.uuid).then(response => {
        if (response.data.code !== 200) {
          this.updateItemState(index, false, true)
          return
        }
        // this.$message.info('新建成功')
        this.handleRefreshAction()
      }).catch(error => {
        console.log(error)
        this.$message.error('新建失败')
        this.updateItemState(index, false, true)
      })
    },
    // 更新index对应item的禁用和编辑状态
    updateItemState (index: number, disable: boolean, renaming: boolean) {
      const item = this.dataArray[index]
      item.disable = disable
      item.renaming = renaming
      this.dataArray.splice(index, 1, item)
      return item
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
    handleTabChange (type: ResourceType) {
      this.categoryType = type
      this.handleRefreshAction()
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
      let path = _.trimStart(this.path, prefix)
      path = _.isEmpty(path) ? '/' : path
      NasFileAPI.searchFile(this.uuid, path, keyword).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'list') as Array<ResourceItem>
        this.dataArray = ResourceHandler.formatResourceList(list)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    handlePasteAction (mode: TaskMode) {
      const clipboard = this.clipboard as ClipboardModel
      const srcItems = clipboard.items
      const destItem = { path: this.path, uuid: this.uuid } as ResourceItem
      const isClip = clipboard.isClip
      if (isClip) {
        NasFileAPI.addMoveTask(srcItems, destItem, mode).then(response => {
          console.log(response)
          if (response.data.code !== 200) return
          this.handlePasteSuccess()
        }).catch(error => {
          console.log(error)
          this.$message.error('网络连接错误，请检测网络')
        })
      } else {
        NasFileAPI.addCopyTask(srcItems, destItem, mode).then(response => {
          console.log(response)
          if (response.data.code !== 200) return
          this.handlePasteSuccess()
        }).catch(error => {
          console.log(error)
          this.$message.error('网络连接错误，请检测网络')
        })
      }
    }
  }
})
</script>
