<template>
  <ul class="operate-list-alter" ref="operateListAlter" :style="{ height: listHeight + 'px'}">
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
          @click="menuClick(subItem, $event)"
          class="operate-item"
          v-bind:class="{
            'operate-item-disable': subItem.disable,
            'operate-item-enable': subItem.enable
          }"
        >
          {{ subItem.title }}
          <img v-show="subItem.children" src="../../assets/operate_icon.png">
          <ul v-show="subItem.children && showChildren" class="operate-children"
            :style="{ 'left': (isChildPosLeft ? '100' : '-79') + 'px', 'border-left': (isChildPosLeft ? 'none' : '1px solid #acacb7') }">
            <li
              v-for="(cell, index) in subItem.children"
              :key="index"
              class="operate-item"
              @click="menuClick(cell, $event)"
              v-bind:class="{ operateItemDisable: cell.disable, operateItem: !cell.disable }"
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
import Vue from 'vue'
import { OperateItem, OperateGroup } from './operateList'

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
    childClick (event) {
      const alter:any = this.$refs.operateListAlter
      this.isChildPosLeft = false
      if (document.body.clientWidth - alter.clientWidth - 30 > event.clientX) {
        this.isChildPosLeft = true
      }
      this.showChildren = true  // 仅当点击了上传，才会展示children
    },
    menuClick (item: OperateItem, event) {
      if (item.disable || item.enable) return
      if (item.command === 'upload') {
        this.childClick(event)
        return
      }
      if (this.isSpecificItem(item)) {
        this.$emit('didSelectItem', 'unkown') // 用于隐藏右键菜单
        return
      }
      this.$emit('didSelectItem', item.command)
    },
    isSpecificItem (item: OperateItem) {
      if (item.command === 'paste') {
        this.showTaskModeDialog()
        return true
      } else if (item.command === 'upload') {
        this.showOpenDialog()
      }
      return false
    },
    showTaskModeDialog () {
      const { dialog } = require('electron').remote
      dialog.showMessageBox({
        type: 'none',
        defaultId: 0,
        message: '请选择重名文件处理模式',
        buttons: buttons
      }).then(data => {
        const mode = this.converMode(data.response)
        this.$emit('didSelectItem', 'paste', mode)
      })
    },
    converMode (index: number) {
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
    showOpenDialog () {
      const { dialog, BrowserWindow } = require('electron').remote
      dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
        properties: ['openFile', 'openDirectory', 'createDirectory']
      }).then(result => {
        console.log(result)
      })
    }
  }
})
const buttons = ['跳过', '重命名', '覆盖']
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
      }
    }
  }
}
</style>
