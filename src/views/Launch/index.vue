// 引入启动页是为了解决在主线程中无法访问localStorage，从而导致无法控制加载的根窗口问题
<template>
  <div class="launch">
    <img src="../../assets/launch_icon.png">
    <span class="title">绿联云</span>
    <span class="desc">你的故事，我时刻守护着</span>
  </div>
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
        } else {
          const result = this.validatorToken()
          this.handleValidatorResult(result)
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
  display: flex;
  flex-direction: column;
  align-items: center;
  img {
    width: 330px;
    margin-top: 110px;
  }
  .title {
    color: #353535;
    font-size: 23px;
    font-weight: bold;
    margin-top: 144px;
  }
  .desc {
    color: #9c9fa9;
    font-size: 19px;
    font-weight: bold;
    margin-top: 20px;
  }
}
</style>
