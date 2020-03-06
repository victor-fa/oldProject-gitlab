<template>
  <div class="header-bar" style="-webkit-app-region: drag">
    <window-menu class="window-menu"/>
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
      <label class="nick-name">{{ this.nickname }}</label>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { Setting, settingList, SettingType } from './Model/settingList'
import processCenter, { EventName } from '../../utils/processCenter'
import { User } from '../../api/UserModel'
import WindowMenu from '../WindowMenu/index.vue'

export default Vue.extend({
  name: 'header-bar',
  components: {
    WindowMenu
  },
  data () {
    return {
      visible: false,
      settingList
    }
  },
  computed: {
    nickname: function () {
      const myThis: any = this
      return _.get(myThis.user, 'userName', '')
    },
    ...mapGetters('User', ['user'])
  },
  methods: {
    didSettingItemClick (sender: Setting) {
      this.visible = false
      if (sender.type === SettingType.logout) {
        processCenter.renderSend(EventName.login)
        this.$store.dispatch('clearCacheUserInfo')
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
  .window-menu {
    margin-right: 15px;
  }
  .split-line {
    width: 1px;
    height: 20px;
    background-color: #01B74F;
  }
  .setting {
    margin: 0px 10px;
    display: flex;
    align-items: center;
    -webkit-app-region: no-drag;
    cursor: pointer;
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
    -webkit-app-region: no-drag;
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
  font-family: "Microsoft YaHei";
  cursor: pointer;
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
