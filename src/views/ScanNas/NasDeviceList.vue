<template>
  <div
    class="nas-device-list"
    :style="{ height: listHeight + 'px' }"
  >
    <a-list
      :dataSource="dataSource"
      :split="false"
    >
      <a-list-item slot="renderItem" slot-scope="item, index">
        <div
          class="nas-item"
          :key="index"
          v-bind:class="{ 'nas-item-selected': isSelectedItem(index) }"
          @click.stop="didSelectItem(index)"
          @dblclick.stop="connectSelectedItem(index)"
          @contextmenu.stop="showContextMenu($event, index)"
        >
          <div class="content">
            <span>{{ item.name }}</span>
            <span>model: {{ item.model }}</span>
            <span v-show="showIpLabel(item)">ip: {{ item.ip }}</span>
            <span>sn: {{ item.sn }}</span>
            <span>mac: {{ item.mac }}</span>
          </div>
          <img src="../../assets/nas_device.png">
        </div>
      </a-list-item>
    </a-list>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { MenuItem } from 'electron'
import { NasInfo } from '../../api/ClientModel'

export default Vue.extend({
  name: 'nas-device-list',
  props: {
    dataSource: Array,
    listHeight: {
      default: 430
    }
  },
  computed: {
    menu: function () {
      const { Menu, MenuItem } = require('electron').remote
      const menu = new Menu()
      menu.append(new MenuItem({ label: '连接设备', click: this.handleMenuItemClick }))
      return menu
    }
  },
  data () {
    return {
      selectedIndex: -1
    }
  },
  methods: {
    resetSelectedItem () {
      this.selectedIndex = -1
    },
    isSelectedItem (index: number) {
      return index === this.selectedIndex
    },
    showIpLabel (item: NasInfo) {
      return !_.isEmpty(item.ip)
    },
    didSelectItem (index: number) {
      this.selectedIndex = index
    },
    connectSelectedItem (index: number) {
      this.$emit('didSelectItem', index)
    },
    showContextMenu (event: MouseEvent, index: number) {
      event.preventDefault()
      this.selectedIndex = index
      const { BrowserWindow } = require('electron').remote
      const currentWindow = BrowserWindow.getFocusedWindow()
      if (currentWindow !== null) {
        this.menu.popup({ window: currentWindow })
      }
    },
    handleMenuItemClick (item: MenuItem) {
      this.$emit('didSelectItem', this.selectedIndex)
    }
  }
})
</script>

<style lang="less" scoped>
.nas-device-list {
  background-color: white;
  overflow: auto;
  .nas-item {
    width: 100%;
    height: 130px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0px 40px 20px;
    border-radius: 10px;
    border: 1px solid #cfd3e5;
    .content {
      display: flex;
      flex-direction: column;
      margin-left: 32px;
      max-width: 150px;
      span:first-child {
        text-align: left;
        font-size: 16px;
        font-weight: 800;
        color: #373737;
        margin-bottom: 15px;
        white-space: nowrap;
      }
      span {
        text-align: left;
        color: #9c9fa9;
        font-size: 11px;
        line-height: 17px;
        white-space: nowrap;
      }
    }
    img {
      height: 96px;
      margin-right: 40px;
    }
  }
  .nas-item-selected {
    background-color: #DEF1EA;
  }
}
</style>

<style>
.nas-device-list .ant-list-header {
  padding: 0px;
}
.nas-device-list .ant-list-item {
  margin: 0px;
  padding: 0px;
}
</style>
