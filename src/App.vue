<template>
  <a-locale-provider :locale="zh_CN">
    <div id="app">
      <keep-alive>
        <router-view />
      </keep-alive>
    </div>
  </a-locale-provider>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { EventBus, EventType } from './utils/eventBus'
import zh_CN from 'ant-design-vue/lib/locale-provider/zh_CN'
import moment from 'moment'
import 'moment/locale/zh-cn'
import UserAPI from '../src/api/UserAPI'
const packageInfo = require('../package');

moment.locale('zh-cn')
export default Vue.extend({
  name: 'app',
  data () {
    return {
      zh_CN
    }
  },
  mounted () {
    this.checkUpdate()
    EventBus.$on(EventType.showToast, (msg: string) => {
      this.$message.error(msg)
    })
  },
  destroyed () {
    EventBus.$off(EventType.showToast)
  },
  methods: {
    // 调接口判断是否需要更新
    checkUpdate () {
      let appId = ''
      let appVersion = 0
      if (process.platform === 'win32') {	// win环境
        appId = packageInfo.winAppId
        appVersion = packageInfo.winAppVersion
      } else {	// mac环境
        appId = packageInfo.macAppId
        appVersion = packageInfo.macAppVersion
      }
      UserAPI.fetchUpdateInfo(appId, appVersion).then(response => {
        if (response.data.code !== 200) {
          console.log('获取更新信息失败');
          return
        }
        if (response.data.data) {
          const pkgUrl = _.get(response.data.data, 'pkgUrl')
          const ipcRenderer = require('electron').ipcRenderer
          ipcRenderer.send('system', 'about', 'new'); // 将更新界面唤醒
        }
      }).catch(error => {
        console.log(error)
      })
    }
  }
})
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  height: 100%;
}
* {
  padding: 0px;
  margin: 0px;
}
img {
  -webkit-user-drag: none;
}
</style>

<style>
@import url('assets/font/icon.css');
</style>
