<template>
  <div class="qrcode-login">
    <label>二维码登录</label>
    <a-spin :spinning="loading">
      <div class="content">
        <img v-if="showCode" :src="qrCode">
        <a-button v-if="showRefresh" @click="handleRefresh">刷新</a-button>
      </div>
    </a-spin>
    <a-button class="back-button" @click="backBtnClick">账号密码登录</a-button>
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

let timeId: NodeJS.Timeout | null = null

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
    showCode () {
      const show = (!this.loading && !_.isEmpty(this.qrCode)) as boolean
      return show
    },
    showRefresh () {
      const show = (!this.loading && _.isEmpty(this.qrCode)) as boolean
      return show
    }
  },
  mounted () {
    this.fetchQrCode()
  },
  methods: {
    backBtnClick () {
      router.go(-1)
    },
    handleRefresh () {
      this.fetchQrCode()
    },
    fetchQrCode () {
      this.loading = true
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
    generateQrCode (code: string) {
      QRCode.toDataURL(code).then(url => {
        this.loading = false
        this.qrCode = url
        this.pullLoginResult(code)
      }).catch(error => {
        this.loading = false
        console.log(error)
      })
    },
    pullLoginResult (code: string) {
      timeId = setTimeout(() => {
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
            this.pullLoginResult(code)
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
      }, 1000);
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
