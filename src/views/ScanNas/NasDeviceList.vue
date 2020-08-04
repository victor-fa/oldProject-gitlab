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
            <span class="content-title">{{ item.name }}</span>
            <span
              v-if="showStatus(item)"
              class="content-status"
              v-bind:class="{ 'status-online': item.status === 1 }"
            >
              {{ item.status | formatStatus }}
            </span>
            <span>model: {{ item.model }}</span>
            <span v-if="showIpLabel(item)">ip: {{ item.ip }}</span>
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
import { NasInfo } from '@/api/ClientModel'
import { DeviceInfo, DeviceStatus } from '../../api/UserModel'

export default Vue.extend({
  name: 'nas-device-list',
  props: {
    dataSource: Array,
    adjust: {
      default: 250
    },
    type: {
      default: 'scan'
    }
  },
  computed: {
    menu: function () {
      const { Menu, MenuItem } = require('electron').remote
      const menu = new Menu()
      menu.append(new MenuItem({ label: '连接设备', click: this.handleMenuItemClick }))
      if (this.type === 'bind') {
        menu.append(new MenuItem({ label: '解绑设备', click: this.handleUnbindAction }))
      }
      return menu
    }
  },
  data () {
    return {
      selectedIndex: -1,
      listHeight: document.body.clientHeight - this.adjust
    }
  },
  mounted () {
    window.addEventListener('resize', this.handleResizeAction)
  },
  destroyed () {
    window.removeEventListener('resize', this.handleResizeAction)
  },
  methods: {
    handleResizeAction () {
      this.listHeight = document.body.clientHeight - this.adjust
    },
    resetSelectedItem () {
      this.selectedIndex = -1
    },
    isSelectedItem (index: number) {
      return index === this.selectedIndex
    },
    showIpLabel (item: NasInfo) {
      return !_.isEmpty(item.ip)
    },
    showStatus (item: DeviceInfo) {
      return item.status !== undefined
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
    },
    handleUnbindAction () {
      this.$emit('unbind', this.selectedIndex)
    }
  },
  filters: {
    formatStatus (status: DeviceStatus) {
      return status === DeviceStatus.offline ? '离线' : '在线'
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
    cursor: pointer;
    .content {
      display: flex;
      flex-direction: column;
      margin-left: 32px;
      max-width: 150px;
      .content-title {
        text-align: left;
        font-size: 16px;
        font-weight: 800;
        color: #373737;
        margin-bottom: 15px;
        white-space: nowrap;
      }
      .content-status {
        color: #FF0101;
        font-weight: bold;
      }
      .status-online {
        color: #007934;
        font-weight: bold;
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
  .nas-item:hover {
    background-color: #DEF1EA80;
  }
  .nas-item-selected, .nas-item-selected:hover {
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
