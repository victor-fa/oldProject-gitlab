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
          iconWidth="20px"
          @click.native="handleCloseAction"
        />
      </div>
      <a-breadcrumb separator=">" class="modal-breadcrumb" ref="breadcrumb">
        <img slot="separator" class="separator-icon" src="../../assets/accessory_icon.png">
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
        <disk-list-view
          v-if="showListType === 0"
          :cacheParams="cacheParams"
          :selectedItem="selectedItem"
          v-on:open="handleDiskOpenAction"
          v-on:didSelectItem="handleDiskSelectAction"
        />
        <file-list-view
          v-if="showListType === 1"
          ref="fileList"
          :cacheParams="cacheParams"
          :selectedItem="selectedItem"
          v-on:open="handleFileOpenAction"
          v-on:didSelectItem="handleFileSelectAction"
        />
        <b-t-list-view
          v-if="showListType === 2"
          v-on:didSelectItem="handleFileSelectAction"
        />
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
            {{ title }}
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
import CustomButton from '@/components/CustomButton/index.vue'
import DiskListView from './DiskListView.vue'
import FileListView from './FileListView.vue'
import BTListView from './BTListView.vue'
import { ResourceItem, CustomModule, StorageInfo, ResourceType, PartitionInfo, CustomInfo } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import StorageHandler from '../Storage/StorageHandler'
import { NasAccessInfo } from '@/api/ClientModel'
import { nasServer } from '@/api/NasServer'
import CustomHandler from '../Custom/CustomHandler'
import FileModalHandler, { CacheParams, CacheType, SelectListType } from './FileModalHandler'
import { BasicResponse, User } from '@/api/UserModel'
import ResourceHandler from '../MainView/ResourceHandler'
import StringUtility from '@/utils/StringUtility'
import { MenuItem, KeyboardEvent, KeyboardInputEvent } from 'electron'
import { EventBus } from '@/utils/eventBus'
import processCenter, { EventName } from '@/utils/processCenter'

export default Vue.extend({
  name: 'resource-move-modal',
  components: {
    CustomButton,
    DiskListView,
    FileListView,
    BTListView
  },
  props: {
    listType: {
      default: SelectListType.disk
    },
    title: {
      default: '移动'
    }
  },
  data () {
    return {
      hideModal: false,
      showListType: this.listType as SelectListType,
      selectedItem: undefined as StorageInfo | PartitionInfo | CustomModule | ResourceItem | undefined,
      cacheArray: [{ name: '全部文件', type: CacheType.disk }] as CacheParams[],
      showPaths: ['全部文件'],
      moveModalIcons
    }
  },
  computed: {
    forwardDisable: function () { // 禁用前进按钮
      const result = (this.selectedItem === undefined) as boolean
      return result
    },
    backwardDisable: function () { // 禁用后退按钮
      const result = (this.cacheArray.length === 1) as boolean
      return result
    },
    newFolderDisbale: function () { // 禁用新进按钮
      const item = _.last(this.cacheArray)
      if (item !== undefined && item.type === CacheType.resource) {
        return false
      }
      return true
    },
    moveDisable: function () { // 禁用移动按钮
      if (this.cacheArray.length === 1 && this.selectedItem === undefined) {
        return true
      } else {
        const item = _.last(this.cacheArray)
        if (item!.type === CacheType.partition && this.selectedItem === undefined) {
          return true
        }
      }
      return false
    },
    cacheParams: function () {
      const cache = _.last(this.cacheArray) as CacheParams
      return cache
    }
  },
  watch: {
    cacheArray: function (newValue: CacheParams[]) {
      const lastItem = _.last(newValue)!
      this.showListType = lastItem.type === CacheType.resource ? SelectListType.file : SelectListType.disk
      this.updateShowPaths(newValue)
    }
  },
  created () {
    document.addEventListener('keyup', this.handleKeyupAction)
  },
  destroyed () {
    document.removeEventListener('keyup', this.handleKeyupAction)
  },
  methods: {
    handleBackwardAction () {
      const index = this.cacheArray.length - 1
      this.cacheArray.pop()
      const item = _.last(this.cacheArray)
      if (item === undefined) return
      this.selectedItem = item.selectedItem
    },
    handleForwardAction () {
      if (this.selectedItem === undefined) return
      const cache = FileModalHandler.generateCacheParams(this.selectedItem)
      if (cache === undefined) return
      const newCacheArray = this.updateLastCache(this.selectedItem)
      newCacheArray.push(cache)
      this.cacheArray = newCacheArray
      this.selectedItem = undefined
    },
    handleCloseAction () {
      this.hideModalAnimate()
    },
    handleBreadcrumbClick (index: number) {
      if (index === this.showPaths.length - 1) return
      if (this.showPaths[index] === '...') return
      this.cacheArray = this.cacheArray.slice(0, index + 1)
    },
    handleNewFolderAction () {
      const fileList = this.$refs.fileList as any
      fileList.newFolder()
    },
    handleCancelAction () {
      this.hideModalAnimate()
    },
    handleMoveAction () {
      const item = this.selectedItem
      if (item === undefined) {
        const cache = _.last(this.cacheArray)!
        if (cache.path !== undefined && cache.uuid !== undefined) {
          this.hideModalAnimate(cache.path, cache.uuid)
        }
        return
      }
      const result = FileModalHandler.generatePathAndUuid(item)
      if (result === undefined) return
      this.hideModalAnimate(result.path, result.uuid)
    },
    handleDiskOpenAction (params: CacheParams, item: StorageInfo | PartitionInfo | CustomModule) {
      const newCacheArray = this.updateLastCache(item)
      newCacheArray.push(params)
      this.cacheArray = newCacheArray
      this.selectedItem = undefined
    },
    handleDiskSelectAction (item?: StorageInfo | PartitionInfo | CustomModule) {
      this.selectedItem = item
    },
    handleFileOpenAction (params: CacheParams, item: ResourceItem) {
      const newCacheArray = this.updateLastCache(item)
      newCacheArray.push(params)
      this.cacheArray = newCacheArray
      this.selectedItem = undefined
    },
    handleFileSelectAction (item: ResourceItem) {
      this.selectedItem = item
    },
    handleKeyupAction (event: KeyboardEvent) {
      const code = (event as any).code
      if (code === 'Enter') {
        event.stopPropagation()
        if (this.hasRenamingItem()) {
          const list = this.$refs.fileList as any
          list.handlePressEnter()
        } else {
          if (this.moveDisable === true) return
          this.handleMoveAction()
        }
      }
    },
    // 根据cacheArray更新展示的路径
    updateShowPaths (cacheArray: CacheParams[]) {
      this.showPaths = cacheArray.map(item => {
        return item.name
      })
      if (this.showPaths.length <= 1) return
      const breadcrumb = this.$refs.breadcrumb as Vue
      FileModalHandler.calculateShowPaths(breadcrumb).then(index => {
        if (index === undefined) return
        this.showPaths = FileModalHandler.replaceElement(cacheArray, 1, index, '...')
      })
    },
    // 判断当前path是否可以点击
    showHover (index: number) {
      if (index === this.showPaths.length - 1) return false
      const path = this.showPaths[index]
      return path !== '...'
    },
    updateLastCache (item: StorageInfo | PartitionInfo | CustomModule | ResourceItem) {
      const cacheArray = _.clone(this.cacheArray)
      const index = cacheArray.length - 1
      const lastItem = cacheArray[index]
      lastItem.selectedItem = item
      cacheArray.splice(index, 1, lastItem)
      return cacheArray
    },
    hasRenamingItem () {
      const item = this.selectedItem
      if (item === undefined) return false
      if (item.hasOwnProperty('renaming')) return (item as ResourceItem).renaming
      return false
    },
    hideModalAnimate (path?: string, uuid?: string) {
      this.hideModal = true
      setTimeout(() => {
        this.$emit('dismiss', path, uuid)
      }, 350);
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
        display: flex;
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
      -webkit-app-region: no-drag;
      .separator-icon {
        width: 10px;
      }
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
