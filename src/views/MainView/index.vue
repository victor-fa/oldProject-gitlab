<template>
  <div class="main-view">
    <div class="layout-header-view">
      <slot name="header" :popoverList="popoverList">
        <main-header-view
          ref="mainHeaderView"
          :toolbars="showToolbars"
          :popoverList="popoverList"
          :funcList="showFuncList"
          v-model="categoryType"
          v-on:callbackAction="handleHeaderViewAction"
        />
      </slot>
      <network-tip v-if="showNetworkTip" :loading="reconnection"/>
    </div>
    <div class="layout-content-view">
      <slot name="content" :dataSource="showArray">
        <a-spin :spinning="loading">
          <resource-list
            :busy="busy"
            :adjust="showAdjust"
            :customGrid="listGrid"
            :dataSource="showArray"
            :arrangeWay="arrangeWay"
            :itemMenu="contextItemMenu"
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
                  :showName="item.name"
                  :arrangeWay="arrangeWay"
                  v-on:callbackAction="handleResourceItemAction"
                />
              </slot>
            </template>
          </resource-list>
        </a-spin>
      </slot>
    </div>
    <div class="layout-footer-view">
      <slot name="footer" :itemCount="itemCount">
        <main-bottom-view :itemCount="itemCount"/>
      </slot>
    </div>
    <operate-list-alter
      v-show="showAlter"
      ref="operateListAlter"
      :operateList="showOperateList"
      :style="alterStyle"
      v-on:didSelectItem="handleContextMenuAction"
    />
    <select-file-path v-if="showSelectModal" v-on:dismiss="handleSelectModalDismiss"/>
    <encrypt-pass-model :visiable="showEncryptModal" v-on:passCallback="handleEncryptPassModal"/>
    <new-offline-modal v-if="showOfflineModal" v-on:dismiss="handleOfflineModalDismiss"/>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainHeaderView from './MainHeaderView.vue'
import MainBottomView from './MainBottomView.vue'
import ResourceList from '@/components/ResourceList/index.vue'
import ResourceListItem from '@/components/ResourceListItem/index.vue'
import NetworkTip from '@/components/NetworkTip/index.vue'
import { ResourceItem, ArrangeWay, OrderType, ResourceType } from '@/api/NasFileModel'
import processCenter, { EventName } from '@/utils/processCenter'
import StringUtility from '@/utils/StringUtility'
import ResourceHandler from './ResourceHandler'
import OperateListAlter from '@/components/OperateListAlter/index.vue'
import NasFileAPI, { TaskMode } from '@/api/NasFileAPI'
import { OperateGroup } from '@/components/OperateListAlter/operateList'
import { sortList, SortList } from '@/model/sortList'
import SelectFilePath from '../SelectFilePath/index.vue'
import NewOfflineModal from '../Transport/MainPage/NewOfflineModal.vue'
import EncryptPassModel from '../Encrypt/EncryptPassModel.vue'
import { User } from '@/api/UserModel'
import { ResourceFuncItem, commonFuncList, toolbars } from './ResourceFuncList'
import ClientAPI from '../../api/ClientAPI'
import { NasInfo, NasAccessInfo } from '../../api/ClientModel'
import { EventBus, EventType } from '../../utils/eventBus'

export default Vue.extend({
  name: 'main-view',
  components: {
    MainHeaderView,
    MainBottomView,
    ResourceList,
    OperateListAlter,
    ResourceListItem,
    NetworkTip,
    SelectFilePath,
    EncryptPassModel,
    NewOfflineModal
  },
  props: {
    count: Number, // 条目总数
    dataSource: Array, // 展示的条目数据
    adjust: { // 列表高度与窗口的高度差
      default: 157
    }, 
    loading: {
      default: false
    },
    busy: { // 是否处理加载更多事件
      default: true
    },
    popoverList: { // header中排序弹窗列表数据
      default: () => {
        return _.cloneDeep(sortList)
      }
    },
    showToolbars: { // 工具栏菜单数据集合
      default: () => {
        return toolbars
      }
    },
    funcList: {
      default: () => {
        return commonFuncList
      }
    }, // header中的操作功能按钮集合
    listGrid: Object, // 列表视图的布局
    contextListMenu: Array, // 右键list菜单数据   
    contextItemMenu: Array // 右键item菜单数据
  },
  data () {
    return {
      sortList,
      showFuncList: _.cloneDeep(this.funcList) as ResourceFuncItem[],
      categoryType: ResourceType.all, // 当前数据分类 
      showArray: this.dataSource as ResourceItem[], // 当前页展示的数据
      alterPosition: { left: '0px', top: '0px' }, // 右键菜单样式
      showAlter: false, // 控制右键菜单的显示与隐藏
      arrangeWay: ArrangeWay.horizontal, // 列表排列方式
      showOperateList: [] as OperateGroup[], // 展示的右键菜单数据
      showSelectModal: false, // 控制路径选择弹窗的显示与隐藏
      showEncryptModal: false, // 控制输入加密密码弹窗的显示与隐藏
      showOfflineModal: false, // 控制离线任务弹窗
      showNetworkTip: false, // 控制断开连接提示条是否展示
      reconnection: false // 控制重新连接加载圈 
    }
  },
  computed: {
    ...mapGetters('Resource', ['clipboard']),
    ...mapGetters('User', ['user']),
    ...mapGetters('NasServer', ['nasInfo', 'accessInfo']),
    alterStyle: function (): object {
      return {
        left: this.alterPosition.left,
        top: this.alterPosition.top
      }
    },
    itemCount: function () {
      if (_.isNumber(this.count)) return this.count as number
      const count = this.showArray.length as number
      return count
    },
    showAdjust: function () {
      const adjust: number = this.adjust
      const tipHeight: number = this.showNetworkTip ? 28 : 0
      return adjust + tipHeight
    }
  },
  watch: {
    dataSource: function (newValue: Array<ResourceItem>) {
      this.showArray = ResourceHandler.classifyArray(newValue, this.categoryType)
    },
    funcList: function (newValue: ResourceFuncItem[]) {
      this.showFuncList = newValue
    }
  },
  mounted () {
    this.updateArrangeWay()
    this.observationWindowAction()
  },
  destroyed () {
    this.removeWindowObserver()
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
    observationWindowAction () {
      window.addEventListener('blur', this.handleWinBlurAction)
      window.addEventListener('online', this.handleOnlineAction)
      window.addEventListener('offline', this.handleOfflineAction)
      EventBus.$on(EventType.disconnect, this.handleOnlineAction)
    },
    removeWindowObserver () {
      window.removeEventListener('blur', this.handleWinBlurAction)
      window.removeEventListener('online', this.handleOnlineAction)
      window.removeEventListener('offline', this.handleOfflineAction)
      EventBus.$off(EventType.disconnect, this.handleOnlineAction)
    },
    // handle header view callback actions
    handleHeaderViewAction (action: string, ...args: any[]) {
      if (!this.canHandleAction(action)) return
      this.$emit('headerCallbackActions', action, ...args)
      switch (action) {
        case 'arrangeChange':
          this.handleArrangeChange(args[0])
          break;
        case 'refresh':
          this.handleInnerRefreshAction()
          break;
        case 'offline':
          this.showOfflineModal = true
          break;
        default:
          break;
      }
    },
    // handle resource list view callback actions
    handleResourceListAction (action: string, ...args: any[]) {
      if (!this.canHandleAction(action)) return
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
    // handle resource list view item callback actions
    handleResourceItemAction (action: string, index: number, ...args: any[]) {
      if (!this.canHandleAction(action)) return
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
    // handle main view context menu actions
    handleContextMenuAction (command: string, ...args: any[]) {
      if (!this.canHandleAction(command)) return
      this.$emit('contextMenuCallbackActions', command, ...args)
      this.showAlter = false
      switch (command) {
        case 'moveto':
          this.handleMoveToAction()
          break
        case 'encrypt':
          this.handleEncryptFile()
          break
        default:
          break
      }
    },
    canHandleAction (action: string) { 
      // 弹窗期间，禁用所有的事件响应
      if (this.showSelectModal || this.showEncryptModal || this.showOfflineModal) return false
      if (action === 'selectAllItems') { // 包含下载操作的item才允许多选
        return ResourceHandler.containOfCommand(this.contextItemMenu as OperateGroup[], 'delete')
      } else if (action === 'copy' || action === 'cut') {
        return ResourceHandler.containOfCommand(this.contextItemMenu as OperateGroup[], action)
      } else if (action === 'paste') {
        return ResourceHandler.containOfCommand(this.contextListMenu as OperateGroup[], action)
      } else if (action === 'delelteItems') {
        return ResourceHandler.containOfCommand(this.contextItemMenu as OperateGroup[], 'delete')
      } else if (action === 'enterRenaming') {
        return ResourceHandler.containOfCommand(this.contextItemMenu as OperateGroup[], 'rename')
      }
      return true
    },
    handleOfflineModalDismiss (isCompleted?: boolean) {
      this.showOfflineModal = false
      if (isCompleted === true) {
        this.$store.dispatch('Resource/increaseTask')
      }
    },
    handleArrangeChange (arrangeWay: ArrangeWay) {
      this.arrangeWay = arrangeWay
      localStorage.setItem('arrangeWay', arrangeWay.toString())
    },
    handleInnerRefreshAction() {
      this.showAlter = false
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
    handleSingleSelection (index: number) {
      const item = this.dataSource[index] as ResourceItem
      if (item.isSelected === true) return
      this.showArray = ResourceHandler.setSingleSelectState(this.showArray, index, true)
      this.showAlter = false
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
    handleEncryptPassModal (callback) {
      if (callback === 'close') {
        this.showEncryptModal = false
        return
      }
      NasFileAPI.loginEncrypt(StringUtility.encryptPassword(callback)).then(response => {
        if (response.data.code !== 200) {
          const msg = response.data.code === 8031 ? '密码错误，请重试' : '您未激活加密空间'
          this.$message.error(msg)
          return
        }
        this.handleEncryptFile()
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    handleEncryptFile () {
      const srcItems = ResourceHandler.disableSelectItems(this.showArray)
      const ugreenNo = (this.user as User).ugreenNo
      NasFileAPI.addEncryptMoveIntoTask(srcItems, `/.ugreen_nas/${ugreenNo}/.safe`, TaskMode.rename).then(response => {
        if (response.data.code === 8071) {
          setTimeout(() => { this.showEncryptModal = true }, 2500);
        }
        if (response.data.code === 8072) {
          this.$message.error('无法加密，请先激活加密空间')
        }
        if (response.data.code !== 200) return
        this.showArray = ResourceHandler.resetDisableState(this.showArray)
        this.$message.info('文件已加密')
        setTimeout(() => {
          this.$emit('headerCallbackActions', 'refresh')
          this.$store.dispatch('Resource/decreaseTask')
        }, 5000);
        this.showEncryptModal = false
      }).catch(error => {
        console.log(error)
        this.showArray = ResourceHandler.resetDisableState(this.showArray)
        this.$message.error('移入失败')
      })
    },
    handleWinBlurAction () {
      this.showAlter = false
    },
    handleOnlineAction () {
      console.log('online')
      this.showNetworkTip = true
      this.reconnection = true
      this.handleReconnectionLogic(1)
    },
    handleOfflineAction () {
      console.log('offline')
      this.showNetworkTip = true
      this.reconnection = false
    },
    handleReconnectionLogic (delay: number) {
      const nas = this.nasInfo as NasInfo
      const secretKey = (this.accessInfo as NasAccessInfo).key
      ClientAPI.reconnectionToNas(nas.sn, nas.mac).then(data => {
        const nas = this.updateNasInfo(data)
        ClientAPI.setBaseUrl(`http://${nas.ip}:${nas.port}`)
        return ClientAPI.login(this.user, secretKey)
      }).then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        const accessInfo = response.data.data as NasAccessInfo
        accessInfo.key = secretKey
        this.$store.dispatch('NasServer/updateNasAccess', accessInfo)
        this.showNetworkTip = false
      }).catch(error => {
        setTimeout(() => {
          this.handleReconnectionLogic(delay * 2)
        }, delay * 1000)
      })
    },
    updateNasInfo (nas: NasInfo) {
      if (nas.ip !== '127.0.0.1') return nas
      const newNas = _.cloneDeep(this.nasInfo) as NasInfo
      newNas.ip = nas.ip
      newNas.port = nas.port
      this.$store.dispatch('NasServer/updateNasInfo', newNas)
      return newNas
    }
  }
})
</script>

<style lang="less" scoped>
.main-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  .layout-header-view {
    display: block;
    padding: 0px;
    background-color: white;
  }
  .layout-content-view {
    flex: 1;
    padding: 0px;
  }
  .layout-footer-view {
    height: 24px;
    padding: 0px;
    background-color: #F7F9FB;
    border-top: 1px solid #BCC0CE40;
  }
}
</style>
