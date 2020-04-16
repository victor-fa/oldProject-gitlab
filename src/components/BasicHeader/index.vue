<template>
  <div class="basic-header" style="-webkit-app-region: drag">
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
    <div class="profile" @click="showAccount()">
      <img class="avatar" :src="imageUrl" alt="" v-if="imageUrl">
      <a-avatar v-else class="avatar" icon="user" size="small"/>
      <label class="nick-name">{{ this.nickName ? this.nickName : this.userName }}</label>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { Setting, settingList, SettingType } from '../../model/settingList'
import processCenter, { EventName } from '../../utils/processCenter'
import { User } from '../../api/UserModel'
import WindowMenu from '../WindowMenu/index.vue'
import UserAPI from '../../api/UserAPI'
import ClientAPI from '../../api/ClientAPI'

export default Vue.extend({
  name: 'basic-header',
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
    nickName: function () {
      const myThis: any = this
      return _.get(myThis.user, 'nicName', '')
    },
    userName: function () {
      const myThis: any = this
      return _.get(myThis.user, 'userName', '')
    },
    imageUrl: function () {
      const myThis: any = this
      return myThis.user.image
    },
    ...mapGetters('User', ['user'])
  },
  methods: {
    didSettingItemClick (sender: Setting) {
      const _this = this as any
      this.visible = false
      switch (sender.type) {
        case SettingType.system:
          _this.$ipc.send('system', 'setting', '');
          break
        case SettingType.about:
          _this.$ipc.send('system', 'about', '');
          break
        case SettingType.feedback:
          _this.$ipc.send('system', 'feedback', '');
          break
        case SettingType.logout:
          this.switchUser()
          break
        case SettingType.quit:
          _this.$electron.remote.getCurrentWindow().close();
          break
        default:
          break
      }
    },
    showAccount () {
      const _this = this as any
      _this.$ipc.send('system', 'account', '');
    },
    switchUser () {
      // const myThis
      UserAPI.logout().then(response => {
        if (response.data.code !== 200) return
        processCenter.renderSend(EventName.login)
        // 调接口同步注销Nas操作，下次登录进来不会直接连当前机子
        ClientAPI.detach().then(response => {
          console.log(response)
          if (response.data.code !== 200) return
          this.$message.success('切换成功！')
        }).catch(error => {
          console.log(error)
        })
        // 清除缓存的用户相关信息
        this.$store.dispatch('User/clearCacheUserInfo')
        this.$store.dispatch('NasServer/clearCacheNas')
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
    }
  }
})
</script>

<style lang="less" scoped>
.basic-header {
  height: 32px;
  padding: 4px 0px;
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
      border-radius: 50%;
      cursor: pointer;
    }
    .nick-name {
      line-height: 17px;
      font-size: 12px;
      color: #484848;
      cursor: pointer;
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
