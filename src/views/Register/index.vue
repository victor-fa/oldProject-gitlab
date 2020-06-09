<template>
  <div class="register-style">
    <span class="title">注册</span>
    <basic-form
      :icon="icons.phone"
      placeholder="请输入手机号"
      v-model="phone"
      class="input-item"
    />
    <basic-form
      :icon="icons.password"
      :isSecure="true"
      placeholder="设置登录密码"
      v-model="password"
      class="input-item"
    />
    <basic-form
      :icon="icons.password"
      :isSecure="true"
      placeholder="再次确认密码"
      v-model="confirmPwd"
      class="input-item"
    />
    <div class="auth-code-item">
      <img :src="icons.authCode">
      <a-input placeholder="请输入验证码" v-model="authCode"/>
      <a-button @click="handleCodeAction" :disabled="authDisabled">{{ buttonTitle }}</a-button>
    </div>
    <div class="check-box-item">
      <a-checkbox :checked="hasRead" @change="handleCheckChange"/>
      我已阅读<span @click="handleProtcolAction">《xxx用户协议》</span>
    </div>
    <a-button
      @click="handleRegisterAction"
      :loading="loading"
      class="register-btn"
    >
      注册
    </a-button>
    <a-button class="account-btn" @click="handleBackAction">账号登录</a-button>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import BasicForm from '../../components/BasicForm/index.vue'
import StringUtility from '../../utils/StringUtility'
import UserAPI from '../../api/UserAPI'
import { SmsType, LoginResponse } from '../../api/UserModel'

export default Vue.extend({
  name: 'register',
  components: {
    BasicForm
  },
  data () {
    return {
      icons,
      phone: '',
      password: '',
      confirmPwd: '',
      authCode: '',
      loading: false,
      authDisabled: false,
      buttonTitle: '获取验证码',
      hasRead: false
    }
  },
  methods: {
    handleCodeAction () {
      const result = this.checkPhoneNumber()
      if (result !== undefined) {
        this.$message.error(result)
        return
      }
      this.authDisabled = true
      UserAPI.smsCode(this.phone, SmsType.register).then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        this.beginCountDown(60)
      }).catch(error => {
        console.log(error)
        this.authDisabled = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    handleCheckChange () {
      this.hasRead = !this.hasRead
    },
    handleProtcolAction () {
      this.hasRead = true
      const { shell } = require('electron')
      shell.openExternal('http://www.baidu.com')
    },
    handleRegisterAction () {
      const result = this.checkInput()
      if (result !== undefined) {
        this.$message.error(result)
        return
      }
      this.loading = true
      UserAPI.register(this.phone, this.password, this.authCode).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        const user = response.data.data as LoginResponse
        this.$store.dispatch('User/updateUser', user.user)
        this.$store.dispatch('User/updateAccessToken', user.accessToken)
        this.$router.push('bind-device-list')
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('注册失败')
      })
    },
    handleBackAction () {
      this.$router.replace('login')
    },
    checkPhoneNumber () {
      if (_.isEmpty(this.phone)) {
        return '请输入手机号'
      }
      if (!StringUtility.vaildatorPhone(this.phone)) {
        return '请输入正确的手机号'
      }
    },
    checkInput (): string | undefined {
      const phoneResult = this.checkPhoneNumber()
      if (phoneResult !== undefined) {
        return phoneResult
      }
      if (_.isEmpty(this.password)) {
        return '请输入登录密码'
      }
      if (_.isEmpty(this.confirmPwd)) {
        return '请再次输入密码'
      }
      if (this.password !== this.confirmPwd) {
        return '两次密码不一致'
      }
      if (_.isEmpty(this.authCode)) {
        return '请输入验证码'
      }
      if (!this.hasRead) {
        return '请勾选用户协议'
      }
    },
    beginCountDown (count: number) {
      if (count <= 0) {
        this.buttonTitle = '获取验证码'
        this.authDisabled = false
        return
      }
      this.buttonTitle = `${count - 1}s`
      setTimeout(() => {
        this.beginCountDown(count - 1)
      }, 1000)
    }
  }
})
const icons = {
  phone: require('../../assets/account_icon.png'),
  password: require('../../assets/password_icon.png'),
  authCode: require('../../assets/auth_code_icon.png')
}
</script>

<style lang="less" scoped>
.register-style {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 0px 44px;
  .title {
    color: #7D7E7E;
    font-size: 22px;
    font-weight: bold;
    margin: 44px 0px 17px;
    align-self: flex-start;
  }
  .input-item, .auth-code-item {
    padding-top: 15px;
    height: 54px;
    align-self: stretch;
  }
  .auth-code-item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #cbcbcb;
    img {
      margin-left: 12px;
      height: 20px;
      width: 18px;
    }
    input {
      width: 180px;
      border: none;
      padding: 0px 20px 0px 16px;
    }
    button {
      width: 102px;
      height: 30px;
      border-radius: 15px;
      margin-left: 12px;
      background-color: #2cd18a;
      color: white;
      font-size: 14px;
      font-weight: bold;
    }
    .ant-btn[disabled] {
      background-color: #2cd18a88;
    }
  }
  .check-box-item {
    align-self: flex-start;
    margin-top: 25px;
    color: #7d7e7e;
    font-size: 12px;
    font-weight: bold;
    .ant-checkbox-wrapper {
      margin-right: 3px;
    }
    span {
      color: #06b650;
      padding: 0px;
      cursor: pointer;
    }
  }
  .register-btn {
    height: 40px;
    width: 300px;
    margin-top: 30px;
    color: white;
    font-size: 15px;
    font-weight: bold;
    border: none;
    border-radius: 20px;
    background-color: #2CD18A;
  }
  .account-btn {
    margin-top: 50px;
    width: 130px;
    border: none;
    box-shadow: none;
    background-color: white;
    color: #06b650;
  }
}
</style>
