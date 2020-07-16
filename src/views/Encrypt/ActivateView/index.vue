<template>
  <div class="activate-view-style">
    <a-spin :spinning="loading">
      <div class="activate-content">
        <span class="activate-title">激活加密空间</span>
        <span class="activate-tip">请务必记住您的密码！</span>
        <p class="activate-desc">为保护您的加密数据安全，系统不会自动记录您的登陆密码。一旦遗忘，将无法通过任何方式打开加密文件。</p>
        <a-checkbox :checked="checked" @change="handleCheckedAction">我已经了解</a-checkbox>
        <a-input
          type="password"
          v-model="firstPwd"
          placeholder="请输入加密空间密码"
          @pressEnter="handleEnterAction"
        />
        <a-input
          type="password"
          v-model="secondPwd"
          placeholder="请再次输入加密空间密码"
          @pressEnter="handleEnterAction"
        />
        <a-button class="confirm-btn" @click="handleConfirmAction">确定</a-button>
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
  name: 'activate-view',
  data () {
    return {
      firstPwd: '',
      secondPwd: '',
      checked: false,
      loading: false
    }
  },
  methods: {
    handleCheckedAction () {
      this.checked = !this.checked
    },
    handleEnterAction () {
      if (_.isEmpty(this.firstPwd) || _.isEmpty(this.secondPwd)) return
      this.handleConfirmAction()
    },
    handleConfirmAction () {
      const tip = this.checkInput()
      if (tip !== null) {
        this.$message.error(tip)
        return
      }
      this.loading = true
      const encryptPwd = StringUtility.encryptPassword(this.firstPwd)
      NasFileAPI.setEncrypt(encryptPwd).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.loginEncryptSpace(encryptPwd)
      }).catch(error => {
        this.loading = false
        this.$message.error('激活失败')
        console.log(error)
      })
    },
    checkInput () {
      if (!this.checked) return '请勾选确认框'
      if (_.isEmpty(this.firstPwd)) return '请输入密码'
      if (_.isEmpty(this.secondPwd)) return '请再次输入密码'
      if (this.firstPwd !== this.secondPwd) return '两次密码不一致'
      return null
    },
    loginEncryptSpace (password: string) {
      this.loading = true
      NasFileAPI.loginEncrypt(password).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        const crypto_token = _.get(response.data, 'data')
        this.$store.dispatch('NasServer/updateCryptoInfo', crypto_token).then(_ => {
          RouterUtility.push('加密空间', 'encrypt-resource-view')
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('登录失败')
      })
    }
  }
})
</script>

<style lang="less" scoped>
.activate-view-style {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  .activate-content {
    margin-top: 120px;
    width: 336px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    .activate-title {
      font-size: 14px;
      color: black;
      font-weight: bold;
      line-height: 21px;
    }
    .activate-tip {
      margin-top: 6px;
      font-size: 14px;
      line-height: 30px;
      color: #DC0000;
    }
    .activate-desc {
      font-size: 14px;
      color: black;
      line-height: 30px;
    }
    .ant-checkbox-wrapper {
      margin-top: 10px;
    }
    .ant-input {
      margin-top: 15px;
      width: 100%;
      height: 42px;
      color: black;
      font-size: 14px;
    }
    .confirm-btn {
      align-self: center;
      margin-top: 28px;
      width: 180px;
      height: 46px;
      font-size: 18px;
      border-radius: 23px;
    }
  }
}
</style>
