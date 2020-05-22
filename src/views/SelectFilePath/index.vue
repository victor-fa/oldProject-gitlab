<template>
  <div class="move-wrapper">
    <div
      class="move-modal"
      v-bind:class="{
        'show-move-modal': !hideModal,
        'hide-move-modal': hideModal
      }"
    >
      <div class="modal-header">
        <div class="indicator">
          <custom-button
            class="btn-item"
            :image="moveModalIcons.backwardIcon"
            :disableImage="moveModalIcons.backward_dis_icon"
            :disable="backwardDisable"
            iconWidth="21px"
            @click.native="handleBackwardAction"
          />
          <custom-button
            class="btn-item"
            :image="moveModalIcons.forwardIcon"
            :disableImage="moveModalIcons.forward_dis_icon"
            :disable="forwardDisable"
            iconWidth="21px"
            @click.native="handleForwardAction"
          />
        </div>
        <span>请选择目标目录</span>
        <custom-button
          class="close-btn"
          :image="moveModalIcons.closeIcon"
          iconWidth="11px"
          @click.native="handleCloseAction"
        />
      </div>
      <a-breadcrumb separator=">" class="modal-breadcrumb" ref="breadcrumb">
        <a-breadcrumb-item
          v-for=" (path, index) in showPaths"
          :key="index"
          :class="{ 'modal-breadcrumb-item': showHover(index) }"
          @click.native.stop="handleBreadcrumbClick(index)"
        >
          {{ path }}
        </a-breadcrumb-item>
      </a-breadcrumb>
      <div class="modal-content">
        <a-spin :spinning="loading">
          <first-directory
            v-if="isFirstList"
            :storages="showArray"
            :customs="showCustoms"
            v-on:callbackAction="handleFirstAction"
          />
          <second-directory
            v-else
            ref="secondDirectory"
            :busy="busy"
            :dataSource="showArray"
            v-on:callbackAction="handleSecondAction"
          />
        </a-spin>
      </div>
      <div class="modal-footer">
        <a-button @click="handleNewFolderAction" :disabled="newFolderDisbale">新建文件夹</a-button>
        <div>
          <a-button @click="handleCancelAction">取消</a-button>
          <a-button
            type="primary"
            :disabled="moveDisable"
            @click="handleMoveAction"
          >
            移动
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import CustomButton from '../../components/CustomButton/index.vue'
import FirstDirectory from './FirstDirectory.vue'
import SecondDirectory from './SecondDirectory.vue'
import { ResourceItem, CustomModule, StorageInfo, ResourceType, PartitionInfo, CustomInfo } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import StorageHandler from '../Storage/StorageHandler'
import { NasAccessInfo } from '../../api/ClientModel'
import { nasServer } from '../../api/NasServer'
import CustomHandler from '../Custom/CustomHandler'
import FileModalHandler, { CacheParams, CacheType } from './FileModalHandler'
import { BasicResponse, User } from '../../api/UserModel'
import ResourceHandler from '../MainView/ResourceHandler'
import StringUtility from '../../utils/StringUtility'
import { MenuItem, KeyboardEvent, KeyboardInputEvent } from 'electron'
import { EventBus } from '../../utils/eventBus'
import processCenter, { EventName } from '../../utils/processCenter'

export default Vue.extend({
  name: 'resource-move-modal',
  components: {
    CustomButton,
    FirstDirectory,
    SecondDirectory
  },
  data () {
    return {
      page: 1,
      busy: false,
      hideModal: false,
      loading: false,
      selectedItem: undefined as StorageInfo | PartitionInfo | CustomModule | ResourceItem | undefined,
      cacheArray: [{ name: '全部文件', type: CacheType.disk }] as CacheParams[],
      showPaths: ['全部文件'],
      showArray: [] as any[],
      storages: [] as StorageInfo[],
      showCustoms: [] as CustomModule[],
      customs: [] as CustomModule[],
      moveModalIcons
    }
  },
  computed: {
    ...mapGetters('NasServer', ['accessInfo']),
    ...mapGetters('Resource', ['homeId']),
    menu: function () {
      const { Menu, MenuItem } = require('electron').remote
      const menu = new Menu()
      menu.append(new MenuItem({ label: '打开', click: this.handleMenuItemClick }))
      return menu
    },
    isFirstList: function () {
      const item = _.last(this.cacheArray)
      if (item !== undefined && item.type === CacheType.resource) {
        return false
      }
      return true
    },
    forwardDisable: function () { // 禁用前进按钮
      const result = (this.selectedItem === undefined) as boolean
      return result
    },
    backwardDisable: function () { // 禁用后退按钮
      const result = (this.cacheArray.length === 1) as boolean
      return result
    },
    newFolderDisbale: function () {
      const item = _.last(this.cacheArray)
      if (item !== undefined && item.type === CacheType.resource) {
        return false
      }
      return true
    },
    moveDisable: function () {
      if (this.cacheArray.length === 1 && this.selectedItem === undefined) {
        return true
      } else {
        const item = _.last(this.cacheArray)
        if (item!.type === CacheType.partition && this.selectedItem === undefined) {
          return true
        }
      }
      return false
    }
  },
  watch: {
    cacheArray: function (value: CacheParams[]) {
      this.showPaths = value.map(item => {
        return item.name
      })
      if (this.showPaths.length <= 1) return
      FileModalHandler.calculateShowPaths(this).then(index => {
        if (index === undefined) return
        this.showPaths = FileModalHandler.replaceElement(this.cacheArray, 1, index, '...')
      })
    }
  },
  created () {
    this.fetchStorages()
    this.fetchCustomList()
    document.addEventListener('keyup', this.handleKeyupAction)
  },
  destroyed () {
    document.removeEventListener('keyup', this.handleKeyupAction)
  },
  methods: {
    showHover (index: number) {
      if (index === this.showPaths.length - 1) return false
      const path = this.showPaths[index]
      return path !== '...'
    },
    handleKeyupAction (event: KeyboardEvent) {
      const code = (event as any).code
      if (code === 'Enter') {
        event.stopPropagation()
        if (this.moveDisable === true) return
        if (this.hasRenamingItem()) {
          const list = this.$refs.secondDirectory as any
          list.handlePressEnter()
        } else {
          this.handleMoveAction()
        }
      }
    },
    hasRenamingItem () {
      for (let index = 0; index < this.showArray.length; index++) {
        const element = this.showArray[index]
        if (element.hasOwnProperty('renaming') && element.renaming === true) return true
      }
      return false
    },
    hideModalAnimate (path?: string, uuid?: string) {
      this.hideModal = true
      setTimeout(() => {
        this.$emit('dismiss', path, uuid)
      }, 350);
    },
    fetchStorages () {
      this.loading = true
      NasFileAPI.fetchStorages().then(response => {
        this.loading = false
        console.log(response)
        if (response.data.code !== 200) return
        const storages = _.get(response.data.data, 'storages')
        this.storages = StorageHandler.formatStorages(storages)
        this.showArray = this.storages
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    fetchCustomList () {
      this.loading = true
      NasFileAPI.fetchCustomList().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'myself_folder_list') as CustomModule[]
        const api_token = (this.accessInfo as NasAccessInfo).api_token
        this.customs = list.map(item => {
          const newItem = CustomHandler.formatItem(item, api_token)
          return newItem
        })
        this.showCustoms = this.customs
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    fetchResourceList (path: string, uuid: string) {
      this.loading = true
      NasFileAPI.fetchResourceList(path, uuid, this.page).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    parseResponse (data: BasicResponse) {
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < 20) this.busy = true
      list = list.filter(item => {
        if (item.type !== ResourceType.folder) {
          this.busy = true
          return false
        }
        return true
      })
      list = ResourceHandler.formatResourceList(list)
      this.showArray = this.page === 1 ? list : this.showArray.concat(list)
    },
    // 根据cacheArray更新当前界面
    updateViewForCacheArray () {
      const item = _.last(this.cacheArray)
      if (item === undefined) return
      this.selectedItem = item.selectedItem
      if (item.type === CacheType.disk) {
        this.showArray = this.storages
        this.showCustoms = this.customs
      } else if (item.type === CacheType.partition) {
        const storage = this.cacheArray[0].selectedItem as StorageInfo
        this.showCustoms = []
        this.showArray = storage.partitions
      } else {
        this.page = 1
        this.busy = false
        this.showArray = []
        this.fetchResourceList(item.path!, item.uuid!)
      }
    },
    handleBackwardAction () {
      const index = this.cacheArray.length - 1
      this.cacheArray.pop()
      this.updateViewForCacheArray()
    },
    handleForwardAction () {
      this.cacheArray = FileModalHandler.pushCache(this.cacheArray, this.selectedItem!)
      this.updateViewForCacheArray()
    },
    handleCloseAction () {
      this.hideModalAnimate()
    },
    handleBreadcrumbClick (index: number) {
      if (index === this.showPaths.length - 1) return
      const item = this.showPaths[index]
      if (item === '...') return
      this.cacheArray = this.cacheArray.slice(0, index + 1)
      this.updateViewForCacheArray()
    },
    handleNewFolderAction () {
      const item = _.head(this.showArray) as ResourceItem | undefined
      if (item === undefined || item.renaming === true) return
      const newName = ResourceHandler.calculateNewFolderName(this.showArray)
      const newItem = {
        type: ResourceType.folder,
        name: newName,
        renaming: true
      } as ResourceItem
      this.showArray.unshift(newItem)
    },
    handleCancelAction () {
      this.hideModalAnimate()
    },
    handleMoveAction () {
      const item = _.last(this.cacheArray)
      if (item === undefined) return
      if (item.type === CacheType.disk) {
        const result = FileModalHandler.parseDiskItem(this.selectedItem as any)
        this.hideModalAnimate(result.path, result.uuid)
      } else if (item.type === CacheType.partition) { 
        const item = this.selectedItem as PartitionInfo
        this.hideModalAnimate(item.path, item.uuid)
      } else {
        if (this.selectedItem === undefined) {
          this.hideModalAnimate(item.path, item.uuid)
        } else {
          const selectedItem = this.selectedItem as ResourceItem
          this.hideModalAnimate(selectedItem.path, selectedItem.uuid)
        }
      }
    },
    handleFirstAction (command: string, index: number, ...args: any[]) {
      switch (command) {
        case 'diskClick':
          this.handleDiskClick(index)
          break;
        case 'diskDoubleClick':
          this.handleOpenDisk(index)
          break;
        case 'diskContextMenu':
          this.handleDiskContextMenu(index)
          break
        case 'customClick':
          this.handleCustomClick(index)
          break;
        case 'customDoubleClick':
          this.handleOpenCustom(index)
          break;
        case 'customContextMenu':
          this.handleCustomContextMenu(index)
          break
        default:
          break;
      }
    },
    handleDiskClick (index: number) {
      if (this.cacheArray.length === 1) { // disk
        this.selectedItem = this.storages[index]
        this.showArray = FileModalHandler.setItemSelected(this.storages, index)
        this.showCustoms = FileModalHandler.resetItemSelected(this.customs)
      } else { // partition
        this.selectedItem = this.showArray[index]
        this.showArray = FileModalHandler.setItemSelected(this.showArray, index)
      }
    },
    handleOpenDisk (index: number) {
      if (this.cacheArray.length === 1) {
        this.selectedItem = this.storages[index]
      } else {
        this.selectedItem = this.showArray[index]
      }
      this.cacheArray = FileModalHandler.pushCache(this.cacheArray, this.selectedItem!)
      this.updateViewForCacheArray()
    },
    handleDiskContextMenu (index: number) {
      this.handleDiskClick(index)
      this.showOpenPopoup()
    },
    handleCustomClick (index: number) {
      this.selectedItem = this.showCustoms[index]
      this.showCustoms = FileModalHandler.setItemSelected(this.customs, index)
      this.showArray = FileModalHandler.resetItemSelected(this.storages)
    },
    handleOpenCustom (index: number) {
      this.selectedItem = this.showCustoms[index]
      this.cacheArray = FileModalHandler.pushCache(this.cacheArray, this.selectedItem!)
      this.updateViewForCacheArray()
    },
    handleCustomContextMenu (index: number) {
      this.handleCustomClick(index)
      this.showOpenPopoup()
    },
    handleSecondAction (command: string, ...args: any[]) {
      switch (command) {
        case 'loadmore':
          this.handleLoadMore()
          break;
        case 'singleClick':
          this.handleResourceItemClick(args[0])
          break;
        case 'doubleClick':
          this.handleResourceItemDbclick(args[0])
          break;
        case 'contextmenu':
          this.handleContextmenu(args[0])
          break;
        case 'newFolderRequest':
          this.handleNewFolderRequest(args[0])
          break
        default:
          break;
      }
    },
    handleLoadMore () {
      const item = _.last(this.cacheArray)
      if (item === undefined) return
      this.page++
      this.fetchResourceList(item.path!, item.uuid!)
    },
    handleResourceItemClick (index: number) {
      this.selectedItem = this.showArray[index]
      this.showArray = FileModalHandler.setItemSelected(this.showArray, index)
    },
    handleResourceItemDbclick (index: number) {
      this.selectedItem = this.showArray[index]
      this.cacheArray = FileModalHandler.pushCache(this.cacheArray, this.selectedItem!)
      this.updateViewForCacheArray()
    },
    handleContextmenu (index: number) {
      this.handleResourceItemClick(index)
      this.showOpenPopoup()
    },
    showOpenPopoup () {
      const { BrowserWindow } = require('electron').remote
      const currentWindow = BrowserWindow.getFocusedWindow()
      if (currentWindow !== null) {
        this.menu.popup({ window: currentWindow })
      }
    },
    handleMenuItemClick (item: MenuItem) {
      this.cacheArray = FileModalHandler.pushCache(this.cacheArray, this.selectedItem!)
      this.updateViewForCacheArray()
    },
    handleNewFolderRequest (newName: string) {
      const item = this.handlreNewFolderItem()
      if (item === undefined) return
      const cacheItem = _.last(this.cacheArray)
      if (cacheItem === undefined) return
      const path = `${cacheItem.path!}/${newName}`
      const uuid = cacheItem.uuid!
      NasFileAPI.newFolder(path, uuid, newName).then(response => {
        console.log(response)
        item.disable = false
        if (response.data.code !== 200) {
          item.renaming = true
          return
        }
        item.uuid = uuid
        item.name = newName
        item.path = path
        this.showArray.splice(0, 1, item)
      }).catch(error => {
        console.log(error)
        this.$message.error('创建失败')
        this.showArray.shift()
      })
    },
    handlreNewFolderItem () {
      const item = this.showArray[0] as ResourceItem
      if (item.renaming !== true) return undefined
      item.disable = true
      item.renaming = false
      this.showArray.splice(0, 1, item)
      return item
    }
  }
})
const moveModalIcons = {
  closeIcon: require('../../assets/close_icon.png'),
  forwardIcon: require('../../assets/forward_icon.png'),
  forward_dis_icon: require('../../assets/forward_dis_icon.png'),
  backwardIcon: require('../../assets/backward_icon.png'),
  backward_dis_icon: require('../../assets/backward_dis_icon.png')
}
</script>

<style lang="less" scoped>
.move-wrapper {
  width: 100vw;
  height: 100vh;
  position: absolute;
  left: 0px;
  top: 0px;
  background-color: rgba(0,0,0,0);
  .move-modal {
    width: 445px;
    height: 365px;
    margin: auto;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    overflow: hidden;
    border: 1px solid #e5e5e5;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.25);
    background-color: white;
    .modal-header {
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .indicator {
        margin-left: 14px;
        .btn-item {
          width: 21px;
          height: 21px;
        }
        :first-child {
          margin-right: 4px;
        }
      }
      span {
        color: #484848;
        font-size: 14px;
        line-height: 15px;
      }
      .close-btn {
        margin-left: 25px;
        margin-right: 13px;
        height: 15px;
        width: 15px;
      }
    }
    .modal-breadcrumb {
      font-size: 12px;
      height: 30px;
      line-height: 30px;
      background-color: #f6f8fb;
      text-align: left;
      padding: 0px 10px;
      overflow: hidden;
      white-space: nowrap;
      border-bottom: 1px solid #e8e8e8;
      .modal-breadcrumb-item:hover {
        color: #06b650;
      }
    }
    .modal-footer {
      height: 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f6f8fb;
      border-top: 1px solid #e8e8e8;
      .ant-btn {
        color: #484848;
        font-size: 12px;
        border-radius: 4px;
        height: 22px;
      }
      .ant-btn:first-child {
        margin-left: 10px;
      }
      .ant-btn:last-child {
        margin-right: 10px;
        margin-left: 7px;
        color: white;
      }
    }
  }
}
.show-move-modal {
  animation: showModal 0.35s ease-in;
}
.hide-move-modal {
  animation: hideModal 0.35s ease-in-out;
}
@keyframes showModal {
  from { transform: translateY(-313px) };
  to { transform: translateY(0px) };
}
@keyframes hideModal {
  from { transform: translateY(0px); opacity: 1.0; };
  to { transform: translateY(-313px); opacity: 1.0; };
}
</style>

<style>
.modal-breadcrumb .ant-breadcrumb-separator {
  margin: 0px 2px;
}
.modal-breadcrumb .ant-breadcrumb-link {
  cursor: default;
}
.move-modal .modal-footer .ant-btn-primary[disabled] {
  cursor: default;
  background-color: #06B650;
}
.move-modal .modal-footer .ant-btn[disabled] {
  cursor: default;
  opacity: 0.5;
}
</style>
