<template>
  <div class="main-view">
    <main-header-view
      :directory="currentPath"
      :popoverList="sortList"
      v-on:CallbackAction="handleHeaderViewAction"
    />
    <a-spin :spinning="loading">
      <resource-list
        ref="resourceList"
        :dataSource="showArray"
        :busy="busy"
        :arrangeWay="arrangeWay"
        v-on:CallbackAction="handleResourceListAction"
      />
    </a-spin>
    <main-bottom-view :itemCount="itemCount"/>
    <operate-list-alter
      v-show="showAlter"
      ref="operateListAlter"
      :operateList="showOperateList"
      :style="alterStyle"
      v-on:didSelectItem="handleAlterAction"
    />
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainHeaderView, { MainHeaderAction } from './MainHeaderView.vue'
import MainBottomView from './MainBottomView.vue'
import ResourceList, { ResourceListAction } from '../../components/ResourceList/index.vue'
import { ResourceItem, ArrangeWay, OrderType, CollectStatus, ShareStatus } from '../../api/NasFileModel'
import processCenter, { EventName } from '../../utils/processCenter'
import ResourceHandler from './ResourceHandler'
import { CategoryType } from '../../model/categoryList'
import OperateListAlter from '../../components/OperateListAlter/index.vue'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse, User } from '../../api/UserModel'
import { OperateGroup } from '../../components/OperateListAlter/operateList'
import { sortList } from '../../model/sortList'

export default Vue.extend({
  name: 'main-view',
  components: {
    MainHeaderView,
    MainBottomView,
    ResourceList,
    OperateListAlter
  },
  data () {
    let items: Array<ResourceItem> = []
    let list: Array<OperateGroup> = []
    let config: PageConfig = { path: '', uuid: '' }
    return {
      loading: false,
      pageConfig: config,
      dataArray: items, // 当前页的全部数据
      showArray: items, // 当前页展示的数据
      currentPath: '', // 当前页的路径
      busy: false,
      arrangeWay: ArrangeWay.horizontal,
      alterPosition: { left: '0px', top: '0px' }, // 右键菜单样式
      showAlter: false, // 是否显示右键菜单
      showOperateList: list, // 展示的操作菜单选项,
      handleItem: false, // 在处理item(如：收藏、分享)过程中，item将设置为disable状态
      sortList: sortList // MianHeaderView中排序弹窗列表的数据源
    }
  },
  watch: {
    dataArray: function (newValue) {
      this.showArray = newValue
    }
  },
  computed: {
    alterStyle: function (): object {
      return {
        left: this.alterPosition.left,
        top: this.alterPosition.top
      }
    },
    itemCount: function () {
      const myThis: any = this
      return myThis.showArray.length
    },
    ...mapGetters('User', ['user']),
    ...mapGetters('Resource', ['clipboard'])
  },
  methods: {
    // handle component callback action
    handleHeaderViewAction (actionType: MainHeaderAction, ...args: any[]) {
      switch (actionType) {
        case MainHeaderAction.tabChange:
          this.handleTabChange(args[0])
          break;
        case MainHeaderAction.back:
          const length = this.currentPath.lastIndexOf('/')
          this.currentPath = this.currentPath.substring(0, length)
          this.handleBackAction()
          break;
        case MainHeaderAction.search:
          this.handleSearchAction(args[0])
          break;
        case MainHeaderAction.endSearch:
          this.handleEndSerchAction()
          break;
        case MainHeaderAction.refresh:
          this.handleRefreshAction()
          break;
        case MainHeaderAction.sortWayChange:
          this.handleSortWayChangeAction(args[0])
          break;
        case MainHeaderAction.arrangeChange:
          this.handleArrangeChange(args[0])
          break;
      }
    },
    handleResourceListAction (actionType: ResourceListAction, ...args: any[]) {
      switch (actionType) {
        case ResourceListAction.loadMoreData:
          this.loadMoreData()
          break;
        case ResourceListAction.openItem:
          this.handleOpenAction()
          break;
        case ResourceListAction.contextMenu:
          this.handleContextMenuAction(args[0], args[1])
          break;
        case ResourceListAction.listContextMenu:
          this.handleListContextMenuAction(args[0])
          break;
        case ResourceListAction.singleSelectItem:
          this.handleSingleAction(args[0])
          break;
        case ResourceListAction.multipleSelectItem:
          this.handleMultipleAction(args[0])
          break;
        case ResourceListAction.listMultipleSelectItem:
          this.handleListMultipleAction(args[0])
          break;
        case ResourceListAction.listClick:
          this.handleListClickAction()
          break;
      }
    },
    handleAlterAction (command: string) {
      this.showAlter = false
      switch (command) {
        case 'open': 
          this.handleOpenAction()
          break;
        case 'openMode':
          
          break;
        case 'download':
          
          break;
        case 'share':
          this.handleShareAction()
          break;
        case 'unshare':
          this.handleUnshareAction()
          break;
        case 'collect':
          this.handleCollection()
          break;
        case 'uncollect':
          this.handleUnCollectAction()
          break;
        case 'copy': 
          this.handleClipboardAction(false)
          break;
        case 'cut':
          this.handleClipboardAction()
          break;
        case 'moveto':
          
          break;
        case 'delete':
          this.handleDeletAction()
          break;
        case 'rename':
          this.handleRenameAction()
          break;
        case 'info':
          this.handleInfoAction()
          break;
        case 'upload':
          
          break;
        case 'newFolder':
          
          break;
        case 'clearClipboard':
          
          break;
        case 'paste':
          
          break;
        case 'refresh':
          this.handleRefreshAction()
          break;
      }
    },
    // handle main header view compoennt action methods
    handleTabChange (categoryType: CategoryType) {
      this.showArray = ResourceHandler.classifyArray(this.dataArray, categoryType)
    },
    handleBackAction () {
      this.overrideBackAction()
    },
    handleSearchAction (keyword: string) {
      this.loading = true
      const prefix = `/.ugreen_nas/${(this.user as User).ugreenNo}`
      let path = this.pageConfig.path
      path = path.substring(prefix.length, path.length)
      path = path.length === 0 ? '/' : path
      NasFileAPI.searchFile(this.pageConfig.uuid, path, keyword).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'list') as Array<ResourceItem>
        if (_.isEmpty(list)) this.busy = true
        this.showArray = ResourceHandler.formateResponseList(list)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    handleEndSerchAction () {
      this.showArray = this.dataArray
    },
    handleRefreshAction () {
      this.overrideRefreshAction()
    },
    handleSortWayChangeAction (sender: OrderType) {
      if (this.dataArray.length === 0) return
      this.overrideSortWayChangeAction(sender)
    },
    handleArrangeChange (arrangeWay: ArrangeWay) {
      this.arrangeWay = arrangeWay
    },
    // handle resource list action methods
    loadMoreData () {
      this.overrideloadMoreData()
    },
    handleOpenAction () {
      const item = ResourceHandler.getFirstSelectItem(this.showArray)
      this.currentPath += `/${item!.name}`
      if (item !== null)  this.overrideOpenAction(item)
    },
    handleContextMenuAction (event: MouseEvent, index: number) {
      this.showArray = ResourceHandler.setSelectState(this.showArray, index, true)
      const list = ResourceHandler.filterItemOperateList(this.showArray)
      this.showContextMenu(list, event)
    },
    handleListContextMenuAction (event: MouseEvent) {
      const list = ResourceHandler.filterOperateList(this.clipboard)
      this.showContextMenu(list, event)
    },
    showContextMenu (list: Array<OperateGroup>, event: MouseEvent) {
      this.showOperateList = list
      this.showAlter = true
      this.$nextTick(() => {
        const alter = this.$refs.operateListAlter as Vue
        this.alterPosition = ResourceHandler.calculateSafePositionOnWindow(event.clientX, event.clientY, alter)
      })
    },
    handleSingleAction (index: number) {
      this.showAlter = false
      this.showArray = ResourceHandler.setSingleSelectState(this.showArray, index, true)
    },
    handleMultipleAction (index: number) {
      this.showArray = ResourceHandler.setSelectState(this.showArray, index, true)
    },
    handleListMultipleAction (index: number) {
      this.showArray = ResourceHandler.shiftMultipleSelect(this.showArray, index)
    },
    handleListClickAction () {
      this.showAlter = false
      if (this.handleItem) return
      this.showArray = ResourceHandler.resetSelectState(this.showArray)
    },
    // handle operate list component action methods
    handleShareAction () {
      this.handleItem = true
      const items = ResourceHandler.disableSelectItems(this.showArray)
      NasFileAPI.shareResource(items).then(response => {
        this.handleItem = false
        if (response.data.code !== 200) return
        this.$message.info('分享成功')
        this.showArray = ResourceHandler.resetShareState(this.showArray)
      }).catch(error => {
        this.handleItemError(error)
      })
    },
    handleUnshareAction () {
      this.handleItem = true
      const items = ResourceHandler.disableSelectItems(this.showArray)
      NasFileAPI.cancelShare(items).then(response => {
        this.handleItem = false
        if (response.data.code !== 200) return
        this.$message.info('取消分享')
        this.showArray = ResourceHandler.resetShareState(this.showArray, ShareStatus.not)
      }).catch(error => {
        this.handleItemError(error)
      })
    },
    handleCollection () {
      this.handleItem = true
      const items = ResourceHandler.disableSelectItems(this.showArray)
      NasFileAPI.collectFile(items).then(response => {
        this.handleItem = false
        if (response.data.code !== 200) return
        this.$message.info('收藏成功')
        this.showArray = ResourceHandler.resetCollectState(this.showArray)
      }).catch(error => {
        this.handleItemError(error)
      })
    },
    handleUnCollectAction () {
      this.handleItem = true
      const items = ResourceHandler.disableSelectItems(this.showArray)
      NasFileAPI.cancelCollect(items).then(response => {
        this.handleItem = false
        if (response.data.code !== 200) return
        this.$message.info('取消成功')
        this.showArray = ResourceHandler.resetCollectState(this.showArray, CollectStatus.not)
      }).catch(error => {
        this.handleItemError(error)
      })
    },
    handleItemError (error: any) {
      console.log(error)
      this.handleItem = false
      this.$message.error('网络连接错误，请检测网络')
      this.showArray = ResourceHandler.resetDisableState(this.showArray)
    },
    handleClipboardAction (isClipboard: boolean = true) {
      const items = ResourceHandler.getSelectItems(this.showArray)
      this.$store.dispatch('Resource/updateClipboard', {
        isClipboard: isClipboard,
        items
      })
    },
    handleDeletAction () {
      const items = ResourceHandler.getSelectItems(this.showArray)
      if (_.isEmpty(items)) return
      console.log(items)
      // TODO: 删除文件
    },
    handleRenameAction () {
      const items = ResourceHandler.getSelectItems(this.showArray)
      if (_.isEmpty(items)) return
      if (items.length > 1) return
      const item = items[0]
      const list: any = this.$refs.resourceList
      list.handleRenameAction(item)
    },
    handleInfoAction () {
      const items = ResourceHandler.getSelectItems(this.showArray)
      if (_.isEmpty(items)) return
      if (items.length > 1) return
      const item = items[0]
      processCenter.renderSend(EventName.mediaInfo, {
        path: 'media-info',
        params: {
          uuid: item.uuid,
          path: item.path
        }
      })
    },
    // subclass implementation methods
    overrideloadMoreData () {
    },
    overrideBackAction () {
    },
    overrideRefreshAction () {
    },
    overrideOpenAction (item: ResourceItem) {
    },
    overrideSortWayChangeAction (sender: OrderType) {
    },
  }
})
interface PageConfig {
  path: string, 
  uuid: string
}
export {
  PageConfig
}
</script>

<style lang="less" scoped>

</style>
