<template>
  <div
    class="basic-header"
    v-bind:class="{ 'darwin-basic-header': isDarwin }"
    style="-webkit-app-region: drag"
    @dblclick.stop="handleDbClickAction"
  >
    <div class="basic-left">
      <span>绿联云</span>
      <span>{{ version }}</span>
    </div>
    <div class="basic-right">
      <window-menu v-if="!isDarwin" class="window-menu"/>
      <a-divider v-if="!isDarwin"  class="split-line" type="vertical"/>
      <a-popover
        trigger="click"
        v-model="visible"
        :arrowPointAtCenter="true"
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
              <img src="../../assets/operate_icon.png" v-show="item.childrens">
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
        <div class="setting" title="设置">
          <img class="setting-icon" src="../../assets/setting_icon.png">
          <img
            src="../../assets/arrow_down.png"
            class="arrow-icon"
            v-bind:class="{ 'rotate-anime': visible, 'restore-anime': restore }"
          >
        </div>
      </a-popover>
      <div class="profile">
        <img class="avatar" :src="imageUrl" alt="" v-if="imageUrl">
        <a-avatar v-else class="avatar" icon="user" size="small"/>
        <label class="nick-name" :title="nickName">{{ nickName }}</label>
      </div>
    </div>
    <basic-model
      :title="basicModel.title"
      :content="basicModel.content"
      :loading="basicModel.loading"
      :type="basicModel.type"
      v-if="basicModel.visiable"
      v-on:dismiss="basicModel.visiable = false"
      v-on:confirm="handleBasicConfirm"/>
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
import { nasCloudIP } from '@/api/CloudServer'
import BasicModel from '../BasicModel/index.vue'
import { EventBus, EventType } from '@/utils/eventBus'

export default Vue.extend({
  name: 'basic-header',
  components: {
    WindowMenu,
    BasicModel
  },
  data () {
    let items: Array<any> = []
    return {
      visible: false, // 设置弹窗是否展示
      restore: false, // 恢复设置弹窗指示器位置
      showItems: items,
      showChildren: false,
      settingList,
      basicModel: {
        visiable: false,
        title: '',
        content: '',
        type: '',
        loading: false
      }
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
    },
    visible: function (newValue: boolean) {
      this.restore = !newValue
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('NasServer', ['nasInfo']),
    isDarwin: function () {
      return process.platform === 'darwin'
    },
    nickName: function () {
      const user = this.user as User
      const name: string | number = _.isEmpty(user.nicName) ? user.ugreenNo : user.nicName
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
    handleDbClickAction () {
      const { BrowserWindow } = require('electron').remote
      const win = BrowserWindow.getFocusedWindow()
      if (win !== null) {
        win.isNormal() ? win.maximize() : win.unmaximize()
      }
    },
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
        case SettingType.setup:
          _this.$electron.shell.openExternal(`${nasCloudIP}/sys/file/resource/${process.platform === 'win32' ? 'pc' : 'mac'}/install.html`)
          break
        case SettingType.introduction:
          _this.$electron.shell.openExternal(`${nasCloudIP}/sys/file/resource/${process.platform === 'win32' ? 'pc' : 'mac'}/products.htm`)
          break
        case SettingType.questions:
          this.$message.info('查看“常见问题”功能待上线')
          break
        case SettingType.download:
          this.$message.info('查看“软件下载”功能待上线')
          break
        default:
          break
      }
    },
    switchUser () {
      this.basicModel = {
        visiable: true,
        title: '确认退出登录？',
        content: '该操作将中断所有正在进行中的任务！',
        type: 'switchUser',
        loading: false
      }
    },
    switchDevice () {
      this.basicModel = {
        visiable: true,
        title: '确认退出登录？',
        content: '该操作将中断所有正在进行中的任务！',
        type: 'switchDevice',
        loading: false
      }
    },
    handleBasicConfirm (flag) {
      this.basicModel.loading = true
      if (flag === 'switchDevice') {  // 切换设备
        this.$store.dispatch('NasServer/clearCacheNas')
        TransportHelper.suspendAllTask()
        processCenter.renderSend(EventName.bindList)
        this.basicModel.loading = false
      } else if (flag === 'switchUser') { // 切换用户
        UserAPI.logout().then(response => {
          console.log(response)
          if (response.data.code !== 200) return
          // 清除缓存的用户相关信息
          this.$store.dispatch('User/clearCacheUserInfo')
          this.$store.dispatch('NasServer/clearCacheNas')
          TransportHelper.suspendAllTask()
          processCenter.renderSend(EventName.login)
          this.basicModel.loading = false
        }).catch(error => {
          console.log(error)
          this.$message.error('网络连接错误,请检测网络')
        })
      } 
    },
  }
})
</script>

<style lang="less" scoped>
.basic-header {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
      }
      .arrow-icon {
        width: 10px;
        height: 10px;
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
        max-width: 100px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    }
  }
}
.darwin-basic-header {
  padding-top: 12px;
  .basic-left {
    margin-left: 15px;
    flex-direction: row;
    span:first-child {
      margin-right: 8px;
    }
  }
  .basic-right {
    flex-direction: row;
    .profile {
      margin-right: 16px;
      flex-direction: row-reverse;
      .nick-name {
        margin-right: 11px;
      }
    }
  }
}
.rotate-anime {
  animation: rotateAnimate .25s linear forwards;
}
.restore-anime {
  animation: restoreAnimate .25s linear forwards;
}
@keyframes rotateAnimate {
  0% { transform: rotate(0deg); };
  100% { transform: rotate(180deg); };
}
@keyframes restoreAnimate {
  0% { transform: rotate(180deg); };
  100% { transform: rotate(360deg); };
}
</style>

<style>
.settingPopover {
  width: 120px;
}
.settingPopover .ant-popover-inner-content {
  padding: 4px 0px;
  cursor: pointer;
}
.settingPopover .setting-item {
  padding: 0px 10px 0px 16px;
  font-size: 12px;
  color: #484848;
  line-height: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.settingPopover .setting-item:hover {
  background-color: #06B65010;
}
.settingPopover .setting-item img {
  width: 7px;
  height: 10px;
}
.operate-children {
  top: 9px;
  left: -86px;
  flex: 1 1 0%;
  position: absolute;
  width: 85px;
  background-color: #fff;
  background-clip: padding-box;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.operate-item {
  padding: 0 12px;
}
.operate-item:hover {
  background-color: #06B65010;
}
</style>
