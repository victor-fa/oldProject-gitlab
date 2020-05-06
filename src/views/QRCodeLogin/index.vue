<template>
  <div class="qrcode-login">
    <label>二维码登录</label>
    <a-spin :spinning="loading">
      <div class="content">
        <img v-if="showCode" :src="qrCode">
        <a-button v-if="showRefresh" @click="handleRefresh">刷新</a-button>
      </div>
    </a-spin>
    <a-button class="back-button" @click="backBtnClick">{{ backTitle }}</a-button>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { loginIcons } from '../Login/iconList'
import router from '../../router'
import UserAPI from '../../api/UserAPI'
import QRCode from 'qrcode'
import { AccessToken, User } from '../../api/UserModel'
import ClientAPI from '../../api/ClientAPI'
import { NasAccessInfo, NasInfo } from '../../api/ClientModel'
import processCenter, { EventName } from '../../utils/processCenter'

let timeId: NodeJS.Timeout | null = null

enum QRCodeType {
  online,
  offline
}

export default Vue.extend({
  name: 'qr-code-login',
  data () {
    return {
      loginIcons,
      loading: false,
      qrCode: '',
      nasInfo: this.$route.params.nasInfo
    }
  },
  computed: {
    qrCodeType () {
      return this.$route.params.type === 'offline' ? QRCodeType.offline : QRCodeType.online
    },
    showCode () {
      const show = (!this.loading && !_.isEmpty(this.qrCode)) as boolean
      return show
    },
    showRefresh () {
      const show = (!this.loading && _.isEmpty(this.qrCode)) as boolean
      return show
    },
    backTitle () {
      const isOffline = (this.qrCodeType === QRCodeType.offline) as boolean
      return isOffline ? '账号密码登录' : '扫描列表'
    }
  },
  mounted () {
    this.fetchQrCode()
  },
  destroyed () {
    if (timeId !== null) clearTimeout(timeId)
  },
  methods: {
    backBtnClick () {
      if (this.qrCodeType === QRCodeType.offline) {
        this.$router.replace('login')
      } else {
        this.$router.go(-1)
      }
    },
    handleRefresh () {
      this.fetchQrCode()
    },
    fetchQrCode () {
      this.loading = true
      if (this.qrCodeType === QRCodeType.online) {
        this.fetchOnlineQrCode()
      } else {
        this.fetchOfflineQrCode()
      }
    },
    fetchOnlineQrCode () {
      UserAPI.fetchQrCode().then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        const code = _.get(response.data.data, 'qrCode')
        this.generateQrCode(code)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    fetchOfflineQrCode () {
      ClientAPI.fetchQrCode().then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        const session = _.get(response.data.data, 'login_session')
        this.generateQrCode(session)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    generateQrCode (code: string) {
      if (_.isEmpty(code)) {
        console.log('code is empty')
        this.loading = false
        return
      }
      QRCode.toDataURL(code).then(data => {
        this.loading = false
        this.qrCode = data
        this.pollResult(code)
      }).catch(error => {
        this.loading = false
        console.log(error)
      })
    },
    pollResult (code: string) {
      timeId = setTimeout(() => {
        if (this.qrCodeType === QRCodeType.online) {
          this.pollOnlineResult(code)
        } else {
          this.pollOfflineResult(code)
        }
      }, 1000);
    },
    pollOnlineResult (code: string) {
      UserAPI.fetchQrCodeLogin(code).then(response => {
        console.log(response)
        if (response.data.code !== 200) {
          this.qrCode = ''
          return
        }
        // parse response
        const accessToken = _.get(response.data.data, 'accessToken') as AccessToken
        const user = _.get(response.data.data, 'user') as User
        if (_.isEmpty(accessToken) || _.isEmpty(user)) {
          // next pull
          this.pollResult(code)
        } else {
          // cache login info
          this.$store.dispatch('User/updateUser', user)
          this.$store.dispatch('User/updateAccessToken', accessToken)
          this.$router.push('bind-device-list')
        }
      }).catch(error => {
        console.log(error)
        this.qrCode = ''
        this.$message.error('二维码过期，请重新获取')
      })
    },
    pollOfflineResult (session: string) {
      ClientAPI.fetchQrCodeLogin(session).then(response => {
        console.log(response)
        if (response.data.code !== 200) {
          this.qrCode = ''
          return
        }
        const accessInfo = response.data.data as NasAccessInfo
        const nasInfo = JSON.parse(this.nasInfo) as NasInfo
        if (_.isEmpty(accessInfo)) {
          this.pollResult(session)
        } else {
          this.$store.dispatch('NasServer/updateNasAccess', accessInfo)
          this.$store.dispatch('NasServer/updateNasInfo', nasInfo)
          processCenter.renderSend(EventName.home)
        }
      }).catch(error => {
        console.log(error)
        this.qrCode = ''
        this.$message.error('二维码过期，请重新获取')
      })
    }
  }
})
</script>

<style lang="less" scoped>
.qrcode-login {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  label {
    width: 280px;
    margin-top: 40px;
    margin-bottom: 70px;
    font-size: 23px;
    font-weight: bold;
    line-height: 19px;
    color: #484848;
    text-align: left;
  }
  .content {
    height: 232px;
    width: 232px;
    overflow: hidden;
    border: 1px solid #323232;
    img {
      width: 280px;
      position: relative;
      top: -25px;
      left: -25px;
    }
    .ant-btn {
      margin-top: 100px;
    }
  }
  .back-button {
    border: none;
    color: #2cd18a;
    font-size: 17px;
    font-weight: bold;
    box-shadow: none;
    margin-top: 90px;
    background-color: white;
  }
}
</style>
