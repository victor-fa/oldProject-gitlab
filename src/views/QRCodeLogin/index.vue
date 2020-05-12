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
import { NasAccessInfo, NasInfo, NasUser } from '../../api/ClientModel'
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
      qrCode: ''
    }
  },
  computed: {
    qrCodeType: function () {
      return this.$route.params.type === 'offline' ? QRCodeType.offline : QRCodeType.online
    },
    showCode: function () {
      const show = (!this.loading && !_.isEmpty(this.qrCode)) as boolean
      return show
    },
    showRefresh: function () {
      const show = (!this.loading && _.isEmpty(this.qrCode)) as boolean
      return show
    },
    backTitle: function () {
      const isOffline = (this.qrCodeType === QRCodeType.offline) as boolean
      return isOffline ? '账号密码登录' : '扫描列表'
    },
    nasInfo: function () {
      const json = this.$route.params.nasInfo
      if (json === undefined) {
        return undefined
      }
      const nasInfo = JSON.parse(json) as NasInfo
      return nasInfo
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
        const codeInfo = this.generateQrJson(code)
        this.generateQrCode(codeInfo)
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
        const codeInfo = this.generateQrJson(session)
        this.generateQrCode(codeInfo)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    generateQrJson (code: string) {
      let codeInfo = {}
      if (_.isEmpty(code)) return codeInfo
      if (this.nasInfo === undefined) {
        codeInfo = { t: 4, code }
      } else {
        codeInfo = {
          t: 3,
          data: {
            id: this.nasInfo.ssl_port,
            name: this.nasInfo.name,
            model: this.nasInfo.model,
            sn: this.nasInfo.sn
          }
        }
      }
      return codeInfo
    },
    generateQrCode (codeInfo: any) {
      if (_.isEmpty(codeInfo)) {
        console.log('code is empty')
        this.loading = false
        return
      }
      const json = JSON.stringify(codeInfo)
      QRCode.toDataURL(json).then(data => {
        this.loading = false
        this.qrCode = data
        this.pollResult(codeInfo.code)
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
        const nasAccess = response.data.data as NasAccessInfo
        const status = _.get(nasAccess, 'auth_status')
        if (status !== 1) {
          this.pollResult(session)
        } else {
          // cache nas info
          this.$store.dispatch('NasServer/updateNasAccess', nasAccess)
          this.$store.dispatch('NasServer/updateNasInfo', this.nasInfo)
          // cache user info
          const user = this.convertUser(_.get(nasAccess, 'user_basic'))
          this.$store.dispatch('User/updateUser', user)
          processCenter.renderSend(EventName.home)
        }
      }).catch(error => {
        console.log(error)
        this.qrCode = ''
        this.$message.error('二维码过期，请重新获取')
      })
    },
    convertUser (nasUser: NasUser) {
      return {
        birthday: nasUser.birthday,
        email: nasUser.email,
        nickName: nasUser.nic_name,
        phoneNo: nasUser.phone_no,
        sex: nasUser.sex,
        ugreenNo: nasUser.ugreen_no,
        versionNo: nasUser.version
      } as User
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
