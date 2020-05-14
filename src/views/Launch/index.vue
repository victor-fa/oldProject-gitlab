// 引入启动页是为了解决在主线程中无法访问localStorage，从而导致无法控制加载的根窗口问题
<template>
  <div class="launch">launch</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { AccessToken } from '../../api/UserModel'
import UserAPI from '../../api/UserAPI'
const packageInfo = require('../../../package');

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
    this.checkUpdate()
    const result = this.validatorToken()
    this.handleValidatorResult(result)
  },
  methods: {
    checkUpdate () {  // 检查是否有新版本
      UserAPI.fetchUpdateInfo(packageInfo.appId, packageInfo.softVersion).then(response => {
        if (response.data.code !== 200) {
					this.$message.error('获取更新信息失败')
          return
				}
				if (response.data.data) {
          const _this = this as any
					const pkgUrl = _.get(response.data.data, 'pkgUrl')
					_this.$ipc.send('system', 'check-for-update', pkgUrl);
				}
      }).catch(error => {
        console.log(error)
      })
    },
    validatorToken (): ValidatorResult {
      if (_.isEmpty(this.user) || _.isEmpty(this.accessToken)) {
        return ValidatorResult.notLogin
      }
      // const timestamp = new Date().valueOf()
      // const localExpiresTime = (this.accessToken as AccessToken).localExpiresTime
      // if (timestamp > localExpiresTime) {
      //   return ValidatorResult.couldTokenExpires
      // }
      if (_.isEmpty(this.nasInfo) || _.isEmpty(this.accessInfo)) {
        return ValidatorResult.notBind
      }
      if (_.isEmpty(this.accessInfo.key)) {
        return ValidatorResult.notBind
      }
      return ValidatorResult.pass
    },
    handleValidatorResult (result: ValidatorResult) {
      switch (result) {
        case ValidatorResult.notLogin:
          this.$router.replace('login')
          break
        case ValidatorResult.couldTokenExpires:
          this.$store.dispatch('User/clearCacheUserInfo')
          this.$router.replace('login').then(() => {
            this.$message.error('token过期，请重新登录')
          })
          break
        case ValidatorResult.notBind:
          this.$router.replace('bind-device-list')
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
    getCurrentWindow () {
      const { BrowserWindow } = require('electron').remote
      return BrowserWindow.getAllWindows()[0]
    }
  }
})
</script>

<style lang="less" scoped>
.launch {
  height: 100%;
  background-color: white;
}
</style>
