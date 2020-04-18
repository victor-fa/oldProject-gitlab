<template>
  <div class="main-view">
    <slot 
      name="header"
      :directory="currentPath"
      :popoverList="popoverList"
    >
      <main-header-view
        :directory="currentPath"
        :popoverList="popoverList"
        v-model="categoryType"
        v-on:CallbackAction="handleHeaderViewAction"
      />
    </slot>
    <a-spin :spinning="loading">
      <resource-list
        :customGrid="listGrid"
        :dataSource="showArray"
        :busy="busy"
        :arrangeWay="arrangeWay"
        v-on:callbackAction="handleResourceListAction"
      >
        <template v-slot:resourceItem="{ item, index, arrangeWay }">
          <slot name="resourceItem" :item="item" :index="index" :arrangeWay="arrangeWay">
            <resource-list-item
              :model="item"
              :index="index"
              :isSelected="item.isSelected"
              :isDisable="item.disable"
              :isRenaming="item.renaming"
              :arrangeWay="arrangeWay"
              v-on:callbackAction="handleResourceItemAction"
            />
          </slot>
        </template>
      </resource-list>
    </a-spin>
    <slot name="footer" :itemCount="itemCount">
      <main-bottom-view :itemCount="itemCount"/>
    </slot>
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
import MainHeaderView from './MainHeaderView.vue'
import MainBottomView from './MainBottomView.vue'
import ResourceList from '../../components/ResourceList/index.vue'
import ResourceListItem from '../../components/ResourceListItem/index.vue'
import { ResourceItem, ArrangeWay, OrderType, ResourceType } from '../../api/NasFileModel'
import processCenter, { EventName } from '../../utils/processCenter'
import ResourceHandler from './ResourceHandler'
import { CategoryType } from '../../model/categoryList'
import OperateListAlter from '../../components/OperateListAlter/index.vue'
import NasFileAPI, { TaskMode } from '../../api/NasFileAPI'
import { OperateGroup } from '../../components/OperateListAlter/operateList'
import { sortList } from '../../model/sortList'

export default Vue.extend({
  name: 'main-view',
  components: {
    MainHeaderView,
    MainBottomView,
    ResourceList,
    OperateListAlter,
    ResourceListItem
  },
  props: {
    currentPath: { // header中展示的当前路径
      default: ''
    },
    loading: {
      default: false
    },
    busy: { // 是否处理加载更多事件
      default: true
    },
    dataSource: Array,
    popoverList: { // header中排序弹窗列表数据
      default: () => {
        return sortList
      }
    },
    listGrid: Object, // 列表视图的布局
    contextListMenu: Array, // 右键list菜单数据   
    contextItemMenu: Array // 右键item菜单数据
  },
  data () {
    return {
      categoryType: CategoryType.all, // 当前数据分类 
      showArray: this.dataSource as ResourceItem[], // 当前页展示的数据
      arrangeWay: ArrangeWay.horizontal, // list的排列方式
      alterPosition: { left: '0px', top: '0px' }, // 右键菜单样式
      showAlter: false, // 控制右键菜单的显示与隐藏
      showOperateList: [] as OperateGroup[] // 展示的右键菜单数据
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
      const count = this.showArray.length as number
      return count
    },
    ...mapGetters('Resource', ['clipboard'])
  },
  watch: {
    dataSource: function (newValue: Array<ResourceItem>) {
      this.showArray = ResourceHandler.classifyArray(newValue, this.categoryType)
    }
  },
  methods: {
    // handle header view callback actions
    handleHeaderViewAction (action: string, ...args: any[]) {
      this.$emit('headerCallbackActions', action, ...args)
      switch (action) {
        case 'tabChange': 
          this.handleTabChange(args[0])
          break;
        case 'endSearch':
          this.handleEndSerchAction()
          break;
        case 'arrangeChange':
          this.handleArrangeChange(args[0])
          break;
        default:
          break;
      }
    },
    handleTabChange (type: CategoryType) {
      this.showArray = ResourceHandler.classifyArray(this.dataSource as ResourceItem[], type)
    },
    handleEndSerchAction () {
      this.showArray = this.dataSource as ResourceItem[]
    },
    handleArrangeChange (arrangeWay: ArrangeWay) {
      this.arrangeWay = arrangeWay
    },
    // handle resource list view callback actions
    handleResourceListAction (action: string, ...args: any[]) {
      this.$emit('listCallbackActions', action, ...args)
      switch (action) {
        case 'contextMenu':
          this.handleListContextMenuAction(args[0])
          break;
        case 'click':
          this.handleListClickAction()
          break;
        default:
          break;
      }
    },
    handleListContextMenuAction (event: MouseEvent) {
      const list = ResourceHandler.filterOperateList(this.contextListMenu as OperateGroup[], this.clipboard)
      this.showContextMenu(list, event)
    },
    showContextMenu (list: Array<OperateGroup> | null, event: MouseEvent) {
      if (list === null) return
      this.showOperateList = list
      this.showAlter = true
      this.$nextTick(() => {
        const alter = this.$refs.operateListAlter as Vue
        this.alterPosition = ResourceHandler.calculateSafePositionOnWindow(event.clientX, event.clientY, alter)
      })
    },
    handleListClickAction () {
      if (this.showAlter) {
        this.showAlter = false
      } else {
        // 没有选中的item，就不更新界面
        if (ResourceHandler.getFirstSelectItem(this.showArray) === null) return
        this.showArray = ResourceHandler.resetSelectState(this.showArray)
      }
    },
    // handle resource list view item callback actions
    handleResourceItemAction (action: string, index: number, ...args: any[]) {
      this.$emit('itemCallbackActions', action, index, ...args)
      switch (action) {
        case 'doubleClick':
          const item = this.showArray[index]
          this.$emit('contextMenuCallbackActions', 'open', item)
          break;
        case 'singleSelection':
          this.handleSingleSelection(index)
          break;
        case 'commandSelection':
          this.handleCommandSelection(index)
          break;
        case 'shiftSelection':
          this.handleShiftSelection(index)
          break;
        case 'contextMenu':
          this.handleItemContextMenu(index, args[0])
          break;
        default:
          break;
      }
    },
    handleSingleSelection (index: number) {
      const select = this.showArray[index].isSelected === true
      this.showArray = ResourceHandler.setSingleSelectState(this.showArray, index, !select)
    },
    handleCommandSelection (index: number) {
      const select = this.showArray[index].isSelected === true
      this.showArray = ResourceHandler.setSelectState(this.showArray, index, !select)
    },
    handleShiftSelection (index: number) {
      this.showArray = ResourceHandler.shiftMultipleSelection(this.showArray, index)
    },
    handleItemContextMenu (index: number, event: MouseEvent) {
      this.showArray = ResourceHandler.setSingleSelectState(this.showArray, index, true)
      const list = ResourceHandler.filterItemOperateList(this.contextItemMenu as OperateGroup[], this.showArray)
      this.showContextMenu(list, event)
    },
    // handle main view context menu actions
    handleAlterAction (command: string, ...args: any[]) {
      this.$emit('contextMenuCallbackActions', command, ...args)
      this.showAlter = false
    }
  }
})
</script>
