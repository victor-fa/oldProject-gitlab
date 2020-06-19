<template>
  <div class="basic-header" style="-webkit-app-region: drag">
    <div class="basic-left">
      <span>绿联云</span>
      <span>{{ version }}</span>
    </div>
    <div class="basic-right">
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
              @click.stop="didSettingItemClick(item)"
              @mouseenter="handleMouseEnter(item)"
            >
              {{ item.title }}
              <img src="../../assets/operate_icon.png">
              <ul v-show="item.childrens && showChildren" class="operate-children">
                <li
                  v-for="(cell, index) in item.childrens"
                  :key="index"
                  @click="didSettingItemClick(cell)"
                  class="operate-item"
                >
                  {{ cell.title }}
                </li>
              </ul>
            </li>
          </ul>
        </template>
        <div class="setting">
          <img class="setting-icon" src="../../assets/setting_icon.png">
          <img class="arrow-icon" src="../../assets/arrow_down.png">
        </div>
      </a-popover>
      <div class="profile">
        <img class="avatar" :src="imageUrl" alt="" v-if="imageUrl">
        <a-avatar v-else class="avatar" icon="user" size="small"/>
        <label class="nick-name" :title="nickName">{{ nickName }}</label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { Setting, settingList, SettingType } from '@/model/settingList'
import processCenter, { EventName } from '@/utils/processCenter'
import { User } from '@/api/UserModel'
import WindowMenu from '../WindowMenu/index.vue'
import UserAPI from '@/api/UserAPI'
import ClientAPI from '@/api/ClientAPI'
import TransportHelper from '@/api/Transport/TransportHelper'

export default Vue.extend({
  name: 'basic-header',
  components: {
    WindowMenu
  },
  data () {
    let items: Array<any> = []
    return {
      visible: false,
      showItems: items,
      showChildren: false,
      settingList
    }
  },
  watch: {
    settingList: function (newVlaue: Array<any>) {
      this.showChildren = false // 重置children
      this.showItems = newVlaue.filter(group => {
        let items: Array<any> = []
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
    ...mapGetters('User', ['user']),
    nickName: function () {
      const user = this.user as User
      const name: string = _.isEmpty(user.nicName) ? user.userName : user.nicName
      return name
    },
    imageUrl: function () {
      const url = this.user.image as string
      return url
    },
    version: function () {
      const packageJson = require('../../../package.json')
      const version = packageJson.version as string
      return `V ${version}`
    }
  },
  methods: {
    handleMouseEnter (item: Setting) {
      this.showChildren = !_.isEmpty(item.childrens)
      if (!this.showChildren) return
      const rightPadding = 10; const secondListWidth = 79
      // this.isChildPosLeft = (this.$el as HTMLElement).offsetLeft + this.listWidth + rightPadding + secondListWidth <= document.body.clientWidth
    },
    didSettingItemClick (sender: Setting) {
      this.visible = false
      const _this = this as any
      switch (sender.type) {
        case SettingType.system:
          processCenter.renderSend(EventName.setting)
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
        case SettingType.switching_device:
          this.switchDevice()
          break
        case SettingType.quit:
          window.close()
          break
        case SettingType.help:
          console.log('help');
          break
        default:
          break
      }
    },
    switchUser () {
      UserAPI.logout().then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        // 清除缓存的用户相关信息
        this.$store.dispatch('User/clearCacheUserInfo')
        this.$store.dispatch('NasServer/clearCacheNas')
        TransportHelper.clearQueueCache()
        processCenter.renderSend(EventName.login)
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
    },
    switchDevice () {
      this.$store.dispatch('NasServer/clearCacheNas')
      TransportHelper.clearQueueCache()
      processCenter.renderSend(EventName.bindList)
    }
  }
})
</script>

<style lang="less" scoped>
.basic-header {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #BCC0CE40;
  .basic-left {
    height: 100%;
    margin-left: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    span:first-child {
      line-height: 20px;
      font-size:20px;
      font-family: PingFang SC;
      font-weight: 800;
      color: black;
    }
    span:last-child {
      color: #484848;
      font-size: 10px;
      font-weight: bold;
      line-height: 10px;
      margin-top: 5px;
    }
  }
  .basic-right {
    height: 100%;
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
      margin:0px 8px;
      display: flex;
      align-items: center;
      -webkit-app-region: no-drag;
      cursor: pointer;
      .setting-icon {
        width: 20px;
        height: 20px;
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
        width: 27px;
        height: 27px;
        margin-right: 8px;
        border-radius: 50%;
        overflow: hidden;
      }
      .nick-name {
        line-height: 17px;
        font-size: 13px;
        color: black;
        max-width: 150px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
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
  padding: 0px 10px 0px 16px;
  font-size: 12px;
  color: #484848;
  line-height: 24px;
  position: relative;
}
.settingPopover .setting-item:hover {
  background-color: #F3F3F3;
}
.settingPopover .setting-item img {
  width: 7px;
  height: 10px;
  margin: 7px 0 0 55px;
  float: right;
}
.settingPopover .setting-item span {
  float: right;
}
.operate-children {
  top: -1px;
  left: -96px;
  flex: 1 1 0%;
  padding: 3px 12px;
  position: absolute;
  width: 95px;
  background-color: #fff;
  background-clip: padding-box;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
