<template>
  <div class="main-view">
    <main-header-view :directory="currentPath" v-on:CallbackAction="handleHeaderViewAction"/>
    <a-spin :spinning="loading">
      <resource-list
        ref="resourceList"
        :dataSource="showArray"
        :busy="busy"
        :arrangeWay="arrangeWay"
        v-on:CallbackAction="handleResourceListAction"
        @click.native="listClick"
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
import { ResourceItem, ArrangeWay, OrderType } from '../../api/NasFileModel'
import processCenter, { EventName } from '../../utils/processCenter'
import ResourceHandler from './ResourceHandler'
import { CategoryType } from '../../model/categoryList'
import OperateListAlter from '../../components/OperateListAlter/index.vue'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse, User } from '../../api/UserModel'
import StringUtility from '../../utils/StringUtility'
import { itemoOperateList, operateList, OperateItem, OperateGroup } from '../../components/OperateListAlter/operateList'

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
      itemoOperateList, // item的右键菜单选项
      operateList, // list的右键菜单选项
      showOperateList: list // 展示的操作菜单选项
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
    ...mapGetters('User', ['user'])
  },
  methods: {
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
          const item = this.showArray[args[0]]
          this.currentPath += `/${item.name}`
          this.handleOpenAction(item)
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
      }
    },
    handleAlterAction (command: string) {
      this.showAlter = false
      switch (command) {
        case 'open': {
          const item = ResourceHandler.getFirstSelectItem(this.showArray)
          this.currentPath += `/${item!.name}`
          if (item !== null)  this.handleOpenAction(item)
        }
          break;
        case 'openMode':
          
          break;
        case 'download':
          
          break;
        case 'share':
          
          break;
        case 'copy':
          
          break;
        case 'cut':
          
          break;
        case 'moveto':
          
          break;
        case 'delete': {
          const items = ResourceHandler.getSelectItems(this.showArray)
          if (!_.isEmpty(items)) this.handleDeletAction(items)
        }
          break;
        case 'rename': {
          const item = ResourceHandler.getFirstSelectItem(this.showArray)
          if (item !== null)  this.handleRenameAction(item)
        }
          break;
        case 'info': {
          const item = ResourceHandler.getFirstSelectItem(this.showArray)
          if (item !== null)  this.handleInfoAction(item)
        }
          break;
      }
    },
    handleDeletAction (items: Array<ResourceItem>) {
      // TODO: 删除文件
    },
    handleRenameAction (item: ResourceItem) {
      const list: any = this.$refs.resourceList
      list.handleRenameAction(item)
    },
    handleInfoAction (item: ResourceItem) {
      processCenter.renderSend(EventName.mediaInfo, {
        path: 'media-info',
        params: {
          uuid: item.uuid,
          path: item.path
        }
      })
    },
    listClick (event: MouseEvent) {
      ResourceHandler.resetSelectState(this.showArray)
      if (!this.showAlter) return
      event.stopPropagation()
      this.showAlter = false
    },
    handleContextMenuAction (event: MouseEvent, index: number) {
      // TODO: 不同场景可能会展示不同的右键菜单
      this.showArray = ResourceHandler.setSelectState(this.showArray, index, false)
      this.showContextMenu(this.itemoOperateList, event)
    },
    handleListContextMenuAction (event: MouseEvent) {
     this.showContextMenu(this.operateList, event)
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
      this.showArray = ResourceHandler.setSelectState(this.showArray, index, true)
    },
    handleMultipleAction (index: number) {
      const item = this.showArray[index]
      item.isSelected = !item.isSelected
      this.showArray.splice(index, 1, item)
    },
    handleMediaInfoAction (item: ResourceItem) {
      if (_.isEmpty(item)) return
      processCenter.renderSend(EventName.mediaInfo, {
        path: 'media-info',
        params: {
          uuid: item.uuid,
          path: item.path
        }
      })
    },
    handleTabChange (categoryType: CategoryType) {
      this.showArray = ResourceHandler.classifyArray(this.dataArray, categoryType)
    },
    handleSearchAction (keyword: string) {
      // TODO: 默认在当前目录下搜索
      this.loading = true
      const prefix = `/.ugreen_nas/${(this.user as User).ugreenNo}`
      let path = this.pageConfig.path
      path = path.substring(prefix.length, path.length)
      path = path.length === 0 ? '/' : path
      NasFileAPI.searchFile(this.pageConfig.uuid, path, keyword).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.handleSearchResponse(response.data)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    handleSearchResponse (data: BasicResponse) {
      const list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list)) this.busy = true
      list.map(value => {
        value.name = StringUtility.formatName(value.path)
        value.showMtime = StringUtility.formatShowMtime(value.mtime)
        value.showSize = StringUtility.formatShowSize(value.size)
      })
      this.showArray = list
    },
    handleEndSerchAction () {
      this.showArray = this.dataArray
    },
    handleArrangeChange (arrangeWay: ArrangeWay) {
      this.arrangeWay = arrangeWay
    },
    // 下面的方法都由子类实现
    loadMoreData () {
    },
    handleBackAction () {
    },
    handleRefreshAction () {
    },
    handleOpenAction (item: ResourceItem) {
    },
    handleSortWayChangeAction (sender: OrderType) {
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
