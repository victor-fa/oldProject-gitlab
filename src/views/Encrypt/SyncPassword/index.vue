<template>
  <div class="login-view-style">
    <a-spin :spinning="loading">
      <div class="login-content">
        <span>同步数据加密</span>
        <a-input
          v-focus
          type="password"
          class="first-input"
          v-model="newPwd"
          placeholder="请输入新加密空间密码"
          @pressEnter="handleEnterAction"
        />
        <a-input
          type="password"
          class="second-input"
          v-model="confirmPwd"
          placeholder="请再次输入新加密空间密码"
          @pressEnter="handleEnterAction"
        />
        <div class="login-botton">
          <a-button class="bottom-btn" @click="handlePreviousAction">上一步</a-button>
          <a-button class="bottom-btn" @click="handleConfirmtAction">确认</a-button>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import NasFileAPI from '../../../api/NasFileAPI'
import StringUtility from '../../../utils/StringUtility'

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
      newPwd: '',
      confirmPwd: '',
      loading: false
    }
  },
  computed: {
    firstPwd: function () {
      const pwd = this.$route.query.firstPwd as string
      return pwd
    },
    secondPwd: function () {
      const pwd = this.$route.query.secondPwd as string
      return pwd
    }
  },
  methods: {
    handleEnterAction () {
      if (_.isEmpty(this.newPwd) || _.isEmpty(this.confirmPwd)) return
      this.handleConfirmtAction()
    },
    handlePreviousAction () {
      this.$router.go(-1)
    },
    handleConfirmtAction () {
      const tip = this.checkInput()
      if (tip !== null) {
        this.$message.error(tip)
        return
      }
      const pwd1 = StringUtility.encryptPassword(this.firstPwd)
      const pwd2 = StringUtility.encryptPassword(this.secondPwd)
      const newPwd = StringUtility.encryptPassword(this.newPwd)
      this.loading = true
      NasFileAPI.syncEncryptPassword(pwd1, pwd2, newPwd).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.$message.info('同步成功，请重新登录')
        this.$router.replace('encrypt-login')
      }).catch(error => {
        console.log(error)
        this.$message.error('同步失败')
        this.loading = false
      })
    },
    checkInput () {
      if (_.isEmpty(this.firstPwd) || _.isEmpty(this.secondPwd)) {
        return '参数错误'
      }
      if (_.isEmpty(this.newPwd)) {
        return '请输入新密码'
      }
      if (_.isEmpty(this.confirmPwd)) {
        return '请再次输入新密码'
      }
      if (this.newPwd !== this.confirmPwd) {
        return '两次密码不一致'
      }
      return null
    }
  }
})
</script>

<style lang="less" scoped>
.login-view-style {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  .login-content {
    margin-top: 150px;
    width: 300px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    span {
      font-size: 13px;
      font-weight: bold;
      line-height: 18px;
      color: black;
      text-align: center;
    }
    .ant-input {
      height: 42px;
      font-size: 14px;
      color: black;
    }
    .first-input {
      margin-top: 37px;
    }
    .second-input {
      margin-top: 26px;
    }
    .login-botton {
      margin-top: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .bottom-btn {
        width: 138px;
        height: 46px;
        border-radius: 23px;
        font-size: 18px;
      }
    }
  }
}
</style>
