<template>
  <div class="header-bar">
    <img class="close" src="../../assets/close_icon.png">
    <img class="resize" src="../../assets/maximize_icon.png">
    <img class="hide-img" src="../../assets/hide_icon.png">
    <a-divider class="split-line" type="vertical"/>
    <a-popover
      trigger="click"
      v-model="visible"
      overlayClassName="settingPopover"
    >
      <template slot="content">
        <ul>
          <li
            v-for="(item, index) in settingList"
            :key="index"
            class="setting-item"
            @click="didSettingItemClick(item)"
          >
          {{ item.title }}
          </li>
        </ul>
      </template>
      <div class="setting">
        <img class="setting-icon" src="../../assets/setting_icon.png">
        <img class="arrow-icon" src="../../assets/arrow_down.png">
      </div>
    </a-popover>
    <div class="profile">
      <a-avatar class="avatar" icon="user" size="small"/>
      <label class="nick-name">123</label>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Setting, settingList, SettingType } from './Model/settingList'
import processCenter, { EventName } from '../../utils/processCenter'

export default Vue.extend({
  name: 'header-bar',
  data () {
    return {
      visible: false,
      settingList
    }
  },
  methods: {
    didSettingItemClick (sender: Setting) {
      this.visible = false
      if (sender.type === SettingType.logout) {
        // const { remote } = require('electron')
        // const win = new remote.BrowserWindow({
        //   width: 800,
        //   height: 600,
        //   webPreferences: {
        //     nodeIntegration: true
        //   }
        // })
        // win.loadURL('app://./index.html')
        // win.webContents.openDevTools()
        processCenter.renderSend(EventName.login, '测试参数')
      }
    }
  }
})
</script>

<style lang="less" scoped>
.header-bar {
  height: 32px;
  padding-top: 8px;
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  .close {
    height: 11px;
    margin-right: 20px;
  }
  .resize {
    height: 13px;
    margin-right: 15px;
  }
  .hide-img {
    height: 2px;
    margin-right: 18px;
  }
  .split-line {
    width: 1px;
    height: 20px;
    background-color: #b1b1b1;
  }
  .setting {
    margin: 0px 10px;
    display: flex;
    align-items: center;
    .setting-icon {
      width: 14px;
      height: 13px;
      margin-right: 4px;
    }
    .arrow-icon {
      width: 6px;
      height: 4px;
    }
  }
  .profile {
    display: flex;
    align-items: center;
    .avatar {
      width: 20px;
      height: 20px;
      margin-right: 4px;
    }
    .nick-name {
      line-height: 17px;
      font-size: 12px;
      color: #484848;
    }
  }
}
</style>

<style>
.settingPopover .ant-popover-inner-content {
  padding: 8px 0px;
}
.settingPopover .setting-item {
  padding: 0px 16px;
  font-size: 12px;
  color: #484848;
  line-height: 24px;
}
.settingPopover .setting-item:hover {
  background-color: gray;
}
</style>
