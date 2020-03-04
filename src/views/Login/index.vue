<template>
  <a-layout class="login-layout">
    <a-layout-header class="header">
      <window-menu class="window-menu"/>
    </a-layout-header>
    <a-layout-content class="content">
      <ul class="content-wrapper">
        <li class="tip">账号密码登录</li>
        <li class="account-form">
          <basic-form
            :icon="loginIcons.account"
            placeholder="用户名/手机号/邮箱"
            v-model="account"
          />
        </li>
        <li class="password-from">
          <basic-form
            :icon="loginIcons.password"
            placeholder="输入您的密码"
            v-model="password"
            isSecure="ture"
          />
        </li>
        <li class="password-checkbox">
          <a-checkbox ref="password_checkbox" @change="onRememberChange">记住密码</a-checkbox>
          <a-button>忘记密码</a-button>
        </li>
        <li class="login-button">
          <a-button block @click="loginAction">登录</a-button>
        </li>
        <li class="register-button">
          <a-button @click="codeLoginBtnClick">扫码登录</a-button>
        </li>
      </ul>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
import Vue from 'vue'
import { loginIcons } from './iconList'
import WindowMenu from '../../components/WindowMenu/index.vue'
import BasicForm from '../../components/BasicForm/index.vue'
import router from '../../router'
import UserAPI from '../../api/UserAPI'
import { LoginResponse } from '../../api/UserModel'
import { ACCESS_TOKEN, USER_MODEL } from '../../common/constants'

export default Vue.extend({
  name: 'login',
  components: {
    BasicForm,
    WindowMenu
  },
  data () {
    return {
      loginIcons,
      account: '',
      password: '',
      rememberPassword: false
    }
  },
  methods: {
    onRememberChange () {
      const element: any = this.$refs.password_checkbox
      this.rememberPassword = element.checked
    },
    codeLoginBtnClick () {
      router.push('qr-code-login')
    },
    loginAction () {
      const myThis: any = this
      const tip = this.checkInputFrom()
      if (tip !== undefined) {
        myThis.$message.warning(tip, 1.5)
        return
      }
      UserAPI.login(this.account, this.password).then((response): void => {
        if (response.data.code !== 200) {
          myThis.$message.warning(response.data.msg)
          return
        }
        const loginResponse = response.data.data as LoginResponse
        this.$store.dispatch('User/updateUser', loginResponse.user)
        this.$store.dispatch('User/updateAccessToken', loginResponse.accessToken)
        // TODO: 登录成功了怎么搞？
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
    checkInputFrom () {
      if (this.account.length === 0) {
        return '请输入账号'
      } else if (this.password.length === 0) {
        return '情输入密码'
      }
    }
  }
})
</script>

<style lang="less" scoped>
.login-layout {
  height: 100%;
  .header {
    height: 40px;
    display: flex;
    padding: 0px 10px;
    flex-direction: row-reverse;
    align-items: center;
    background-color: #fdffff;
    .window-menu {
      margin-right: 10px;
    }
  }
  .content {
    padding: 0px;
    background-color: #fdffff;
    display: flex;
    justify-content: center;
    .content-wrapper {
      width: 285px;
      li {
        text-align: left;
      }
      .tip {
        padding-top: 6.5vh;
        font-size: 19px;
        font-weight: bold;
        color: #7d7e7e;
      }
      .account-form {
        padding-top: 10vh;
      }
      .password-from {
        padding-top: 1.5vh;
      }
      .password-checkbox {
        height: 22px;
        margin-top: 3.3vh;
        display: flex;
        justify-content: space-between;
        .ant-checkbox-wrapper {
          color: #7d7e7e;
          font-size: 14px;
          font-weight: bold;
        }
        .ant-btn {
          height: 22px;
          font-size: 14px;
          color: #7d7e7e;
          font-weight: bold;
          border: none;
          padding: 0px;
          box-shadow: none;
          border-bottom: 1px solid #c8cbc7;
          border-radius: 0px;
          margin-right: 10px;
        }
      }
      .login-button {
        padding: 6vh 20px 0px 10px;
        .ant-btn {
          height: 40px;
          color: white;
          font-size: 15px;
          font-weight: bold;
          border: none;
          border-radius: 20px;
          background-image: linear-gradient(to right, #29cb7a, #4de9b9);
        }
      }
      .register-button {
        display: flex;
        justify-content: center;
        padding-top: 13vh;
        .ant-btn {
          border: none;
          box-shadow: none;
          background-color: white;
          color: #06b650;
        }
      }
    }
  }
}
</style>
