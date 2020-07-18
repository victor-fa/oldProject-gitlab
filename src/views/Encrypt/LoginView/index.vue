<template>
  <div class="encrypt-login">
    <a-spin :spinning="loading">
      <div class="encrypt-login-content">
        <img src="../../../assets/encrypt_login_icon.png">
        <span>进入加密空间</span>
        <a-input
          v-focus
          type="password"
          v-model="password"
          placeholder="请输入加密空间密码"
          @pressEnter="handleEnterAction"
        />
        <a-button class="confirm-btn" @click="handleLoginAction">登录</a-button>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import NasFileAPI from '../../../api/NasFileAPI'
import StringUtility from '../../../utils/StringUtility'
import RouterUtility from '../../../utils/RouterUtility'

export default Vue.extend({
  name: 'login-view',
  directives: {
    focus: {
      inserted: function (el) {
        el.focus()
      }
    }
  },
  data () {
    return {
      password: '',
      loading: false
    }
  },
  methods: {
    handleEnterAction () {
      if (_.isEmpty(this.password)) return
      this.handleLoginAction()
    },
    handleLoginAction () {
      if (_.isEmpty(this.password)) {
        this.$message.error('请输入密码')
        return
      }
      this.loading = true
      const pwd = StringUtility.encryptPassword(this.password)
      NasFileAPI.loginEncrypt(pwd).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) {
          this.$message.error(response.data.code === 8031 ? '密码错误，请重试' : '您未激活加密空间')
          return
        }
        const crypto_token = _.get(response.data, 'data')
        this.$store.dispatch('NasServer/updateCryptoInfo', crypto_token).then(_ => {
          RouterUtility.push('加密空间', 'encrypt-resource-view')
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接失败，请检测网络')
      })
    }
  }
})
</script>

<style lang="less" scoped>
.encrypt-login {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  .encrypt-login-content {
    margin-top: 138px;
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
      width: 77px;
    }
    span {
      margin-top: 27px;
      font-size: 14px;
      line-height: 21px;
      color: black;
      font-weight: bold;
    }
    .ant-input {
      margin-top: 28px;
      width: 297px;
      height: 42px;
      font-size: 14px;
      color: black;
    }
    .ant-btn {
      margin-top: 28px;
      width: 180px;
      height: 46px;
      border-radius: 23px;
    }
  }
}
</style>
