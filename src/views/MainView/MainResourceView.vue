<template>
  <main-view
    ref="mainView"
    :busy="busy"
    :count="totalSize"
    :loading="loading"
    :dataSource="dataArray"
    :canDropListView="canDrop"
    :contextItemMenu="itemMenu"
    :contextListMenu="listMenu"
    :showToolbars="showToolbars"
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
import NasFileAPI, { TaskMode, maxSize } from '@/api/NasFileAPI'
import { BasicResponse, User } from '@/api/UserModel'
import ResourceHandler from './ResourceHandler'
import { ClipboardModel } from '../../store/modules/Resource'
import UploadTask from '../../api/Transport/UploadTask'
import { resourceContextMenu, listContextMenu } from '../../components/OperateListAlter/operateList'
import StringUtility from '../../utils/StringUtility'
import processCenter, { EventName } from '../../utils/processCenter'
import { TaskError, TaskStatus, TaskErrorCode } from '../../api/Transport/BaseTask'
import { uploadQueue } from '../../api/Transport/TransportHelper'
import RouterUtility from '../../utils/RouterUtility'
import { toolbars } from './ResourceFuncList'
import path from 'path'
import { fileMines } from '@/model/fileMines'
import { nasServer } from '@/api/NasServer'
import { NasAccessInfo } from '@/api/ClientModel'

export default Vue.extend({
  name: 'main-resource-view',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    return {
      page: 1,
      busy: false,
      loading: false,
      totalSize: 0,
      canDrop: true, // list view是否支持拖拽
      dataArray: [] as ResourceItem[],
      order: OrderType.byNameDesc, // 当前选择的排序规则
      itemMenu: _.cloneDeep(resourceContextMenu), // item的右键菜单
      listMenu: _.cloneDeep(listContextMenu), // list的右键菜单
      delayTimer: null as NodeJS.Timer | null
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('Resource', ['clipboard']),
    ...mapGetters('NasServer', ['accessInfo']),
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
    },
    showToolbars: function () {
      return _.cloneDeep(toolbars).map(item => {
        item.disable = false
        return item
      })
    }
  },
  watch: {
    $route: {
      handler: function () {
        this.checkQuery() && this.updateView()
      }
    }
  },
  created () {
    this.updateView()
    uploadQueue.addListener('taskStatusChange', this.handleTaskStatusChange)
  },
  destroyed () {
    uploadQueue.removeListener('taskStatusChange', this.handleTaskStatusChange)
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer)
      this.delayTimer = null
    }
  },
  methods: {
    updateView () {
      this.dataArray = [] // 新的界面，需要清空缓存的数据
      this.handleRefreshAction()
      const mainView = this.$refs.mainView as any
      mainView !== undefined && mainView.resetHeaderView()
    },
    checkQuery () {
      if (this.$route.name !== 'main-resource-view') return false
      if (_.isEmpty(this.path) || _.isEmpty(this.uuid)) return false
      return true
    },
    fetchResourceList () {
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
    parseResponse (data: BasicResponse) {
      this.totalSize = _.get(data.data, 'total')
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < maxSize) this.busy = true
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
        const task = new UploadTask(path, this.path, this.uuid)
        task.matchTaskIcon()
        uploadQueue.addTask(task)
        this.$store.dispatch('Resource/increaseTask')
      })
    },
    handleTaskStatusChange (taskId: number) {
      const task = uploadQueue.searchTask(taskId)
      if (task === undefined) return
      if (task.status === TaskStatus.finished) {
        if (this.delayTimer !== null) clearTimeout(this.delayTimer)
        this.delayTimer = setTimeout(() => {
          this.handleRefreshAction()
          this.delayTimer = null
        }, 1000)
      } else if (task.status === TaskStatus.error) {
        if (task.error!.code !== TaskErrorCode.serverError) {
          this.$message.error(task.error!.desc)
        }
      }
    },
    handleNewFolderAction () {
      const newName = ResourceHandler.calculateNewFolderName(this.dataArray)
      const newItem = {
        type: ResourceType.folder,
        isSelected: true,
        name: newName,
        renaming: true
      } as ResourceItem 
      this.dataArray = [newItem].concat(this.dataArray)
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
      const _this = this as any
      const items = ResourceHandler.getSelectItems(this.dataArray)
      if (_.isEmpty(items) || items.length > 1) return
      const item = items[0]
      _this.$ipc.send('file-control', 0, item)
    },
    handleTabChange (type: ResourceType) {
      this.handleRefreshAction()
    },
    handleSortWayChangeAction (order: OrderType) {
      this.order = order
      this.handleRefreshAction()
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
      if (_.isEmpty(srcItems)) return
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
    },
    handleDragStartAction (index: number, event: DragEvent) {
      if (event.dataTransfer === null) return
      this.canDrop = false
      const model = this.dataArray[index]
      const suffix = path.extname(model.path)
      const mineType = fileMines.get(suffix)
      const token = (this.accessInfo as NasAccessInfo).api_token
      const url = `${nasServer.defaults.baseURL}/v1/file/download?uuid=${model.uuid}&path=${encodeURIComponent(model.path)}&api_token=${token}`
      const metaData = [mineType, model.name, url].join(':')
      event.dataTransfer.setData('DownloadUrl', metaData)
      event.dataTransfer.effectAllowed = 'copy'
    },
    handleDragEndAction (index: number, event: DragEvent) {
      this.canDrop = true
    }
  }
})
</script>
