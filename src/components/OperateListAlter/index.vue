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
          @click="menuClick(subItem)"
          class="operate-item"
          v-bind:class="{
            'operate-item-disable': subItem.disable,
            'operate-item-enable': subItem.enable
          }"
        >
          {{ subItem.title }}
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
      showItems: items
    }
  },
  watch: {
    operateList: function (newVlaue: Array<OperateGroup>) {
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
    menuClick (item: OperateItem) {
      if (item.disable || item.enable) return
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
    }
  }
}
</style>
