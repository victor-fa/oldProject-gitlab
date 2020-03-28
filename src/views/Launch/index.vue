// 引入启动页是为了解决在主线程中无法访问localStorage，从而导致无法控制加载的根窗口问题
<template>
  <div class="launch">launch</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { AccessToken } from '../../api/UserModel'

enum ValidatorResult {
  notLogin,
  notBind,
  couldTokenExpires,
  pass
}

export default Vue.extend({
  name: 'launch',
  computed: {
    ...mapGetters('User', ['user', 'accessToken']),
    ...mapGetters('NasServer', ['nasInfo', 'accessInfo'])
  },
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
        this.$router.replace({
          name: 'connecting',
          params: {
            sn: this.nasInfo.sn,
            mac: this.nasInfo.mac,
            secretKey: this.accessInfo.key
          }
        })
        break
    }
  },
  methods: {
    validatorToken (): ValidatorResult {
      if (_.isEmpty(this.user) || _.isEmpty(this.accessToken)) {
        return ValidatorResult.notLogin
      }
      const timestamp = new Date().getDate()
      const localExpiresTime = (this.accessToken as AccessToken).localExpiresTime
      if (timestamp > localExpiresTime) {
        return ValidatorResult.couldTokenExpires
      }
      // TODO: 有用户信息，没有nas信息，可能是上次连接nas失败，或者是绑定nas失败
      if (_.isEmpty(this.nasInfo) || _.isEmpty(this.accessInfo)) {
        return ValidatorResult.notBind
      }
      return ValidatorResult.pass
    },
    loadLoginPage (secondPath: string = 'login') {
      // temporary code
      this.getCurrentWindow().resizable = true
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
