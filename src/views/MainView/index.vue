<template>
  <a-layout class="main-view">
    <a-layout-header class="main-header-view">
      <slot 
        name="header"
        :popoverList="popoverList"
      >
        <main-header-view
          ref="mainHeaderView"
          :popoverList="popoverList"
          :funcList="showFuncList"
          v-model="categoryType"
          v-on:CallbackAction="handleHeaderViewAction"
        />
      </slot>
    </a-layout-header>
    <a-layout-content class="main-content-view">
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
                :index="item.index"
                :isSelected="item.isSelected"
                :isDisable="item.disable"
                :isRenaming="item.renaming"
                :showName="item.name"
                :arrangeWay="arrangeWay"
                v-on:callbackAction="handleResourceItemAction"
              />
            </slot>
          </template>
        </resource-list>
      </a-spin>
    </a-layout-content>
    <a-layout-footer class="main-footer-view">
      <slot name="footer" :itemCount="itemCount">
        <main-bottom-view :itemCount="itemCount"/>
      </slot>
    </a-layout-footer>
    <operate-list-alter
      v-show="showAlter"
      ref="operateListAlter"
      :operateList="showOperateList"
      :style="alterStyle"
      v-on:didSelectItem="handleAlterAction"
    />
    <select-file-path v-if="showSelectModal" v-on:dismiss="handleSelectModalDismiss"/>
    <encrypt-pass-model :visiable="showEncryptModal" v-on:passCallback="handleEncryptPassModal"/>
  </a-layout>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainHeaderView from './MainHeaderView.vue'
import MainBottomView from './MainBottomView.vue'
import ResourceList from '@/components/ResourceList/index.vue'
import ResourceListItem from '@/components/ResourceListItem/index.vue'
import { ResourceItem, ArrangeWay, OrderType, ResourceType } from '@/api/NasFileModel'
import processCenter, { EventName } from '@/utils/processCenter'
import StringUtility from '@/utils/StringUtility'
import ResourceHandler from './ResourceHandler'
import OperateListAlter from '@/components/OperateListAlter/index.vue'
import NasFileAPI, { TaskMode } from '@/api/NasFileAPI'
import { OperateGroup } from '@/components/OperateListAlter/operateList'
import { sortList, SortList } from '@/model/sortList'
import SelectFilePath from '../SelectFilePath/index.vue'
import RouterUtility from '@/utils/RouterUtility'
import EncryptPassModel from '../Encrypt/EncryptPassModel.vue'
import { User } from '@/api/UserModel'
import { ResourceFuncItem, commonFuncList } from './ResourceFuncList'

export default Vue.extend({
  name: 'main-view',
  components: {
    MainHeaderView,
    MainBottomView,
    ResourceList,
    OperateListAlter,
    ResourceListItem,
    SelectFilePath,
    EncryptPassModel
  },
  props: {
    loading: {
      default: false
    },
    busy: { // 是否处理加载更多事件
      default: true
    },
    dataSource: Array,
    popoverList: { // header中排序弹窗列表数据
      default: () => {
        return _.cloneDeep(sortList)
      }
    },
    funcList: Array, // header中的操作功能按钮集合
    listGrid: Object, // 列表视图的布局
    contextListMenu: Array, // 右键list菜单数据   
    contextItemMenu: Array // 右键item菜单数据
  },
  data () {
    let list = _.isEmpty(this.funcList) ? _.cloneDeep(commonFuncList) : this.funcList
    return {
      sortList,
      showFuncList: list as ResourceFuncItem[],
      categoryType: ResourceType.all, // 当前数据分类 
      showArray: this.dataSource as ResourceItem[], // 当前页展示的数据
      alterPosition: { left: '0px', top: '0px' }, // 右键菜单样式
      showAlter: false, // 控制右键菜单的显示与隐藏
      arrangeWay: ArrangeWay.horizontal, // 列表排列方式
      showOperateList: [] as OperateGroup[], // 展示的右键菜单数据
      showSelectModal: false, // 控制路径选择弹窗的显示与隐藏
      showEncryptModal: false // 控制输入加密密码弹窗的显示与隐藏
    }
  },
  computed: {
    ...mapGetters('Resource', ['clipboard']),
    ...mapGetters('User', ['user']),
    alterStyle: function (): object {
      return {
        left: this.alterPosition.left,
        top: this.alterPosition.top
      }
    },
    itemCount: function () {
      const count = this.showArray.length as number
      return count
    }
  },
  watch: {
    dataSource: function (newValue: Array<ResourceItem>) {
      this.showArray = ResourceHandler.classifyArray(newValue, this.categoryType)
    }
  },
  mounted () {
    this.updateArrangeWay()
    const { BrowserWindow } = require('electron').remote
    const win = BrowserWindow.getFocusedWindow()
    if (win === null) return
		win.on('blur', event => { this.showAlter =  false });
  },
  methods: {
    // public methods
    resetHeaderView () {
      const headerView = this.$refs.mainHeaderView as any
      headerView.resetState()
    },
    updateShowArray (items: ResourceItem[]) {
      this.showArray = items
    },
    updateArrangeWay () {
      let arrangeIndex = -1
      for (let index = 0; index < this.showFuncList.length; index++) {
        const element = this.showFuncList[index]
        if (element.command === 'arrange') {
          arrangeIndex = index
          break
        }
      }
      if (arrangeIndex === -1) return
      const way = localStorage.getItem('arrangeWay')
      if (way === null) return
      this.arrangeWay = Number(way)
      const item = this.showFuncList[arrangeIndex]
      item.isSelected = this.arrangeWay === ArrangeWay.vertical
      this.showFuncList.splice(arrangeIndex, 1, item)
    },
    // handle header view callback actions
    handleHeaderViewAction (action: string, ...args: any[]) {
      this.$emit('headerCallbackActions', action, ...args)
      switch (action) {
        case 'arrangeChange':
          this.handleArrangeChange(args[0])
          break;
        case 'back':
          this.handleBackAction()
          break;
        case 'refresh':
          this.handleInnerRefreshAction()
          break;
        case 'click':
          this.handleListClickAction()
          break
        default:
          break;
      }
    },
    handleArrangeChange (arrangeWay: ArrangeWay) {
      this.arrangeWay = arrangeWay
      localStorage.setItem('arrangeWay', arrangeWay.toString())
    },
    handleBackAction () {
      RouterUtility.pop()
    },
    handleInnerRefreshAction() {
      this.showAlter = false
    },
    // handle resource list view callback actions
    handleResourceListAction (action: string, ...args: any[]) {
      // 这里移动弹窗没有使用window，故弹出时需要屏蔽所有快捷键
      if (this.showSelectModal === true || this.showEncryptModal === true) return 
      this.$emit('listCallbackActions', action, ...args)
      switch (action) {
        case 'contextMenu':
          this.handleListContextMenuAction(args[0])
          break;
        case 'click':
          this.handleListClickAction()
          break;
        case 'selectAllItems':
          this.handleSelectAllItemsAction()
          break
        default:
          break;
      }
    },
    handleListContextMenuAction (event: MouseEvent) {
      this.showArray = ResourceHandler.resetSelectState(this.showArray)
      const list = ResourceHandler.filterOperateList(this.contextListMenu as OperateGroup[], this.clipboard, this.categoryType)
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
        this.showArray = ResourceHandler.resetSelectState(this.showArray)
      }
    },
    handleSelectAllItemsAction () {
      this.showArray = this.showArray.map(item => {
        item.isSelected = true
        return item
      })
    },
    // handle resource list view item callback actions
    handleResourceItemAction (action: string, index: number, ...args: any[]) {
      this.$emit('itemCallbackActions', action, index, ...args)
      switch (action) {
        case 'doubleClick':
          const item = this.dataSource[index]
          this.$emit('contextMenuCallbackActions', 'open', item)
          break;
        case 'singleSelection':
          this.handleSingleSelection(index)
          break;
        case 'commandSelection':
          this.handleCommandSelection(index)
          break;
        case 'ctrlSelection':
          this.handleCtrlSelection(index)
          break
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
      const item = this.dataSource[index] as ResourceItem
      if (item.isSelected === true) return
      this.showArray = ResourceHandler.setSingleSelectState(this.showArray, index, true)
    },
    handleCommandSelection (index: number) {
      if (process.platform === 'darwin') {
        const item = this.dataSource[index] as ResourceItem
        const select = item.isSelected === true
        this.showArray = ResourceHandler.setSelectState(this.showArray, index, !select)
      }
    },
    handleCtrlSelection (index: number) {
      if (process.platform === 'win32') {
        const item = this.dataSource[index] as ResourceItem
        const select = item.isSelected === true
        this.showArray = ResourceHandler.setSelectState(this.showArray, index, !select)
      }
    },
    handleShiftSelection (index: number) {
      this.showArray = ResourceHandler.shiftMultipleSelection(this.showArray, index)
    },
    handleItemContextMenu (index: number, event: MouseEvent) {
      const item = this.dataSource[index] as ResourceItem
      if (item.isSelected !== true) {
        this.showArray = ResourceHandler.setSingleSelectState(this.showArray, index, true)
      }
      const list = ResourceHandler.filterItemOperateList(this.contextItemMenu as OperateGroup[], this.showArray, item)
      this.showContextMenu(list, event)
    },
    // handle main view context menu actions
    handleAlterAction (command: string, ...args: any[]) {
      this.$emit('contextMenuCallbackActions', command, ...args)
      this.showAlter = false
      switch (command) {
        case 'moveto':
          this.handleMoveToAction()
          break;
        case 'encrypt':
          this.handleEncryptAction()
          break;
        default:
          break;
      }
    },
    handleMoveToAction () {
      this.showSelectModal = true
    },
    handleSelectModalDismiss (path?: string, uuid?: string) {
      this.showSelectModal = false
      if (path === undefined || uuid === undefined) return
      const srcItems = ResourceHandler.disableSelectItems(this.showArray)
      const destItem = { path, uuid } as ResourceItem
      NasFileAPI.addMoveTask(srcItems, destItem, TaskMode.rename).then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        this.showArray = ResourceHandler.resetDisableState(this.showArray)
        this.$message.info('任务添加成功')
        this.$store.dispatch('Resource/increaseTask')
        this.$emit('headerCallbackActions', 'refresh')
      }).catch(error => {
        console.log(error)
        this.showArray = ResourceHandler.resetDisableState(this.showArray)
        this.$message.error('移动失败')
      })
    },
    handleEncryptAction () {
      this.showEncryptModal = true
    },
    handleEncryptPassModal (callback) {
      if (callback === 'close') {
        this.showEncryptModal = false
        return
      }
      NasFileAPI.loginEncrypt(StringUtility.encryptPassword(callback)).then(response => {
        if (response.data.code !== 200) return
        const crypto_token = _.get(response.data, 'data')
        this.handleEncryptFile(crypto_token)
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    handleEncryptFile (crypto_token) {
      const srcItems = ResourceHandler.disableSelectItems(this.showArray)
      const ugreenNo = (this.user as User).ugreenNo
      NasFileAPI.addEncryptMoveIntoTask(srcItems, `/.ugreen_nas/${ugreenNo}/.safe`, TaskMode.rename, crypto_token).then(response => {
        if (response.data.code !== 200) return
        this.showArray = ResourceHandler.resetDisableState(this.showArray)
        setTimeout(() => {
          this.$message.info('文件已加密')
          this.$emit('headerCallbackActions', 'refresh')
        }, 2000);
        this.showEncryptModal = false
      }).catch(error => {
        console.log(error)
        this.showArray = ResourceHandler.resetDisableState(this.showArray)
        this.$message.error('移入失败')
      })
    }
  }
})
</script>

<style lang="less" scoped>
.main-view {
  height: 100%;
  .main-header-view {
    height: 36px;
    padding: 0px;
    background-color: #F7F9FB;
    border-bottom: 1px solid #BCC0CE40;
  }
  .main-content-view {
    padding: 0px;
  }
  .main-footer-view {
    height: 24px;
    padding: 0px;
    background-color: #F7F9FB;
    border-top: 1px solid #BCC0CE40;
  }
}
</style>
