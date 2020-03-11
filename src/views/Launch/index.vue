// 引入启动页是为了解决在主线程中无法访问localStorage，从而导致无法控制加载的根窗口问题
<template>
  <div class="launch">launch</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import processCenter, { MainEventName, EventName } from '../../utils/processCenter'
import { USER_MODEL, ACCESS_TOKEN, NAS_INFO, NAS_ACCESS } from '../../common/constants'
import { AccessToken, User } from '../../api/UserModel'
import { EventBus } from '../../utils/eventBus'
import ClientAPI from '../../api/ClientAPI'
import { NasInfo, NasAccessInfo } from '../../api/ClientModel'

enum ValidatorResult {
  notLogin,
  notBind,
  couldTokenExpires,
  pass
}

export default Vue.extend({
  name: 'launch',
  created () {
    const result = this.validatorToken()
    switch (result) {
      case ValidatorResult.notLogin:
        this.loadLoginPage()
        break
      case ValidatorResult.couldTokenExpires:
        this.$store.dispatch('User/clearCacheUserInfo')
        this.loadLoginPage().then(() => {
          this.$message.error('token过期，请重新登录')
        })
        break
      case ValidatorResult.notBind:
        this.loadLoginPage('scan-nas')
        break
      case ValidatorResult.pass:
        // TODO: 展示连接中界面
        this.searchNasInLAN()
        break
    }
  },
  methods: {
    validatorToken (): ValidatorResult {
      const userJson = localStorage.getItem(USER_MODEL)
      const tokenJson = localStorage.getItem(ACCESS_TOKEN)
      if (userJson === null || tokenJson === null) {
        return ValidatorResult.notLogin
      }
      const timestamp = new Date().getDate()
      const token = JSON.parse(tokenJson) as AccessToken
      if (timestamp > token.localExpiresTime) {
        return ValidatorResult.couldTokenExpires
      }
      const nasInfoJson = localStorage.getItem(NAS_INFO)
      const nasAccessJson = localStorage.getItem(NAS_ACCESS)
      if (nasInfoJson === null || nasAccessJson) {
        return ValidatorResult.notBind
      }
      return ValidatorResult.pass
    },
    loadLoginPage (secondPath: string = 'login', tip?: string) {
      this.getCurrentWindow().resizable = false
      return this.$router.replace({
        name: 'login-layout',
        params: {
          secondPath: secondPath
        }
      })
    },
    getCurrentWindow () {
      const { BrowserWindow } = require('electron').remote
      return BrowserWindow.getAllWindows()[0]
    },
    searchNasInLAN () {
      // TODO: 在连接中界面里，定时器应该在界面销毁时销毁
      const nasInfoJson = localStorage.getItem(NAS_INFO)
      const nasInfo = JSON.parse(nasInfoJson!) as NasInfo
      const timeId:any = this.beginTimer()
      ClientAPI.searchNas(nasInfo.sn, nasInfo.mac, data => {
        if (data.sn === nasInfo.sn && data.mac === nasInfo!.mac) {
          window.clearTimeout(timeId)
          this.onlineConnectNas(data)
        } 
      }, error => {
        // TODO: 扫描当前设备失败，界面如何展示
        console.log(error)
      })
    },
    beginTimer () {
      return setTimeout(() => {
        ClientAPI.closeBoardcast()
        // TODO: 未扫描到当前设备，界面如何展示
      }, 5000)
    },
    onlineConnectNas (nasInfo: NasInfo) {
      const nasAccessJson = localStorage.getItem(NAS_ACCESS)
      const nasAccess = JSON.parse(nasAccessJson!) as NasAccessInfo
      const userJson = localStorage.getItem(USER_MODEL)
      const user = JSON.parse(userJson!) as User
      ClientAPI.login(user, nasAccess.key).then(response => {
        console.log(response)
        if (response.data.code !== 200) {
          console.log(response.data.msg)
          // TODO: 设备连接失败
          return
        }
        processCenter.renderSend(EventName.home)
      }).catch(error => {
        console.log(error)
        // TODO: 设备连接失败
      })
    }
  }
})
</script>

<style lang="less" scoped>
.launch {
  height: 100vh;
  background-color: #f6f8fb;
}
</style>
