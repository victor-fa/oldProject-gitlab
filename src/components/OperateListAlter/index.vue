<template>
  <ul class="operate-list-alter" :style="{ height: listHeight + 'px'}">
    <li
      v-for="(item, index) in showItems"
      :key="index"
      class="operate-group"
    >
      <img :src="item.icon">
      <ul class="operate-items">
        <li
          v-for="(subItem, index) in item.items"
          :key="index"
          class="operate-item"
          v-bind:class="{
            'operate-item-disable': subItem.disable,
            'operate-item-enable': subItem.enable
          }"
          @click.stop="menuClick(subItem)"
          @mouseenter="handleMouseEnter(subItem)"
        >
          {{ subItem.title }}
          <img v-show="subItem.childrens" src="../../assets/operate_icon.png">
          <ul v-show="subItem.childrens && showChildren" class="operate-children"
            :style="{ 'left': (isChildPosLeft ? '100' : '-79') + 'px', 'border-left': (isChildPosLeft ? 'none' : '1px solid #acacb7') }">
            <li
              v-for="(cell, index) in subItem.childrens"
              :key="index"
              @click="menuClick(cell)"
              class="operate-item"
              v-bind:class="{
                'operate-item-disable': subItem.disable,
                'operate-item-enable': subItem.enable
              }"
            >
              {{ cell.title }}
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import _ from 'lodash' 
import Vue from 'vue'
import { OperateItem, OperateGroup } from './operateList'
import StringUtility from '@/utils/StringUtility'

export default Vue.extend({
  name: 'operate-list-alter',
  props: {
    operateList: Array
  },
  data () {
    let items: Array<OperateGroup> = []
    return {
      showItems: items,
      showChildren: false, // 默认children不展示
      isChildPosLeft: false // 二级菜单是否展示在左侧

    }
  },
  watch: {
    operateList: function (newVlaue: Array<OperateGroup>) {
      this.showChildren = false // 重置children
      this.showItems = newVlaue.filter(group => {
        let items: Array<OperateItem> = []
        for (let index = 0; index < group.items.length; index++) {
          const element = group.items[index]
          if (!element.isHidden) items.push(element)
        }
        if (items.length === 0) return false
        group.items = items
        return true
      })
    }
  },
  computed: {
    listHeight: function () {
      const marginCount = 6 * this.operateList.length
      const borderCount = 1 * (this.operateList.length + 1)
      let itemCount = 0
      for (let index = 0; index < this.operateList.length; index++) {
        const element = this.operateList[index] as OperateGroup
        for (let i = 0; i < element.items.length; i++) {
          const el = element.items[i];
          if (el.isHidden) continue
          itemCount += 16
        }
      }
      return marginCount + borderCount + itemCount
    },
    listWidth: function () {
      return 100
    }
  },
  methods: {
    handleMouseEnter (item: OperateItem) {
      this.showChildren = !_.isEmpty(item.childrens)
      if (!this.showChildren) return
      const rightPadding = 10; const secondListWidth = 79
      this.isChildPosLeft = (this.$el as HTMLElement).offsetLeft + this.listWidth + rightPadding + secondListWidth <= document.body.clientWidth
    },
    menuClick (item: OperateItem) {
      if (item.disable || item.enable || !_.isEmpty(item.childrens)) return
      if (this.isSpecificItem(item)) {
        this.$emit('didSelectItem', 'unkown') // 用于隐藏右键菜单
        return
      }
      this.$emit('didSelectItem', item.command)
    },
    isSpecificItem (item: OperateItem) {
      if (item.command === 'paste') {
        this.$emit('didSelectItem', 'paste', 'rename')
        return true
      } else if (dialogCommands.indexOf(item.command) !== -1) {
        this.showOpenDialog(item.command)
        return true
      }
      return false
    },
    showTaskModeDialog () {
      const { dialog } = require('electron').remote
      dialog.showMessageBox({
        type: 'info',
        defaultId: 0,
        message: '请选择重名文件处理模式',
        buttons: buttons
      }).then(data => {
        const mode = this.convertMode(data.response)
        this.$emit('didSelectItem', 'paste', mode)
      })
    },
    convertMode (index: number) {
      switch (index) {
        case 0:
          return 'skip'
        case 1:
          return 'rename'
        case 2:
          return 'cover'
      }
      return 0
    },
    showOpenDialog (command: string) {
      const { dialog, BrowserWindow } = require('electron').remote
      const list = this.matchProperties(command)
      const title = command === 'download' ? '下载' : '选择'
      dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
        buttonLabel: title,
        properties: (list as any)
      }).then(result => {
        const newCommand = command === 'download' ? 'download' : 'upload'
        // filter cancel action
        if (_.isEmpty(result.filePaths)) return
        const paths = result.filePaths.map(item => {
          return StringUtility.replaceString(item, '\\', '/')
        })
        this.$emit('didSelectItem', newCommand, paths)
      })
    },
    matchProperties (command: string) {
      switch (command) {
        case 'download':
          return ['createDirectory', 'openDirectory']
        case 'upload':
          return ['createDirectory', 'openDirectory', 'openFile', 'multiSelections']
        case 'uploadFile':
          return ['createDirectory', 'openFile', 'multiSelections']
        case 'uploadFolder':
          return ['createDirectory', 'openDirectory', 'multiSelections']
        default:
          return []
      }
    }
  }
})
const buttons = ['跳过', '重命名', '覆盖']
const dialogCommands = ['download', 'upload', 'uploadFile', 'uploadFolder']
</script>

<style lang="less" scoped>
.operate-list-alter {
  position: absolute;
  width: 100px;
  height: 189px;
  border: 1px solid #acacb7;
  background-color: white;
  .operate-group {
    display: flex;
    align-items: flex-start;
    img {
      width: 10px;
      margin: 6px 6px 0px;
    }
    .operate-items {
      flex: 1;
      padding: 3px 0px;
      border-left: 1px solid #acacac;
      border-bottom: 1px solid #acacb7;
      .operate-item {
        display: flex;
        flex: 1;
        padding: 0px 8px;
        color: #484848;
        font-size: 10px;
        line-height: 16px;
      }
      .operate-item:hover {
        background-color: #DEF1EA;
      }
      .operate-item-disable {
        color: #48484866;
      }
      .operate-item-enable {
        color: #48484866;
        cursor:not-allowed;
      }
      img {
        height: 10px;
        width: 9px;
        position: absolute;
        right: 3px;
        top: 6px;
        margin: 0;
      }
      .operate-children {
        // left: 100px;
        top: -1px;
        flex: 1;
        padding: 3px 0px;
        border-right: 1px solid #acacac;
        border-bottom: 1px solid #acacb7;
        border-top: 1px solid #acacb7;
        position: absolute;
        width: 79px;
        background-color: #fff;
      }
    }
  }
}
</style>
