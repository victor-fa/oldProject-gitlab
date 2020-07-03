<template>
  <div class="forget">
		<WindowsHeader :data="header" />
    <div class="forget-content">
      <ul class="content-wrapper">
        <li class="tip">重置密码</li>
        <li class="account-form">
          <basic-form :icon="loginIcons.account" :maxLength=11 placeholder="请输入手机号" v-model="account"/>
        </li>
        <li class="password-from">
          <basic-form :icon="loginIcons.password" :maxLength=16 placeholder="请输入新密码" v-model="password" isSecure="ture"/>
        </li>
        <li class="password-from">
          <basic-form :icon="loginIcons.password" :maxLength=16 placeholder="重新输入新密码" v-model="rePassword" isSecure="ture"/>
        </li>
        <li class="password-from" v-if="codeVisiable">
          <basic-form :icon="loginIcons.password" :suffix="codeTips" :maxLength=6 placeholder="请输入短信验证码" v-model="code" v-on:pressEnter="resetAction"/>
        </li>
        <li class="login-button">
          <a-button block @click="resetAction" :loading="loading">{{submitText}}</a-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { loginIcons } from '../Login/iconList'
import BasicForm from '@/components/BasicForm/index.vue'
import UserAPI from '@/api/UserAPI'
import { LoginResponse, Account, User } from '@/api/UserModel'
import { message } from 'ant-design-vue'
import StringUtility from '@/utils/StringUtility'
import WindowsHeader from '@/components/Disk/WindowHeader.vue'

export default Vue.extend({
  name: 'DiskForgetPass',
  components: {
    BasicForm,
    WindowsHeader
  },
  data () {
    let items: Account[] = []
    const _this = this as any
    return {
      loginIcons,
      account: '',
      password: '',
      rePassword: '',
      code: '',
      codeTips: '',
      codeCount: 60,
      timer: null as any,
      loading: false,
      codeVisiable: false,
      submitText: '重置',
			header: {
				color: '#666',
				title: '',
				resize: false,
				mini: false,
				close: () => {
          _this.closeAndClear()
					return true;
				}
			}
    }
  },
	watch: {
		codeCount: {
			handler() {
        if (this.codeCount === 0) {
          this.timer && clearInterval(this.timer);
          this.codeCount = 60
        }
			}
		}
  },
  methods: {
    resetAction () {
      if (!this.checkInputFrom()) return
      this.loading = true
			const input = {
				userName: this.account,
				password: StringUtility.encryptPassword(this.password),
				code: this.code
			}
      UserAPI.changePass(input).then(response => {
				if (response.data.code !== 200) return
				this.account = '';
				this.password = '';
				this.rePassword = '';
				this.code = '';
        this.codeVisiable = false
        this.loading = false
        this.$message.success('重置成功，请牢记密码')
        setTimeout(() => {
          this.closeAndClear()
        }, 1000);
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
    },
    checkInputFrom () {
      if (this.account.length === 0) {
        this.$message.warning('请输入帐号', 1.5)
        return false
      } else if (this.password.length === 0) {
        this.$message.warning('请输入密码', 1.5)
        return false
      } else if (this.rePassword.length === 0) {
        this.$message.warning('请重新输入密码', 1.5)
        return false
      } else if (this.password !== this.rePassword) {
				this.$message.warning('密码不一致，请检查');
				return;
			} else if (this.code === '' || this.submitText === '发送验证码') {  // 两种情况下都要发送验证码
				UserAPI.smsCode(this.account, 2).then(response => {
					this.loading = false;
					if (response.data.code !== 200) return
          this.codeVisiable = true
          this.handlecCountDown() // 开启倒计时
          this.$message.success('短信已发送到手机')
				}).catch(error => {
					this.loading = false;
					console.log(error)
					this.$message.error('网络连接错误,请检测网络')
				})
				return
			} else if (this.code.length === 0) {
        this.$message.warning('请输入验证码', 1.5)
        return false
      }
      return true
    },
    handlecCountDown () {
      this.timer = setInterval(() => {
        this.codeCount--
        this.codeTips = this.codeCount === 0 ? '' : `${this.codeCount}s`  // 倒计时到0s时不展示
        this.submitText = this.codeCount === 0 ? '发送验证码' : '重置'  // 倒计时到0s时用于发送验证码
      }, 1000)
    },
    cacheUserInfo (response: LoginResponse) {
      this.$store.dispatch('User/updateUser', response.user)
      this.$store.dispatch('User/updateAccessToken', response.accessToken)
      const account: Account = { account: this.account, password: this.password }
      this.$store.dispatch('User/addAccount', account)
    },
    closeAndClear () {
      const _this = this as any
      _this.$electron.remote.getCurrentWindow().close();
    }
  }
})
</script>

<style lang="less" scoped>
.forget-content {
  float: left;
  width: 100%;
  height: 100%;
  background: #fff;
  padding: 0 20px 20px;
  color: #000;
}
.forget {
  height: 100%;
  background-color: #fdffff;
  display: block;
  justify-content: center;
  .content-wrapper {
    width: 100%;
    padding: 0px 59px 0px 52px;
    li {
      text-align: left;
    }
    .tip {
      padding-top: 40px;
      font-size: 23px;
      font-weight: bold;
      color: #7d7e7e;
    }
    .account-form {
      padding-top: 65px;
    }
    .password-from {
      padding-top: 18px;
      .send-msg {
      }
    }
    .password-checkbox {
      height: 22px;
      margin-top: 25px;
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
      padding: 40px 12px 0px 25px;
      .ant-btn {
        height: 40px;
        color: white;
        font-size: 15px;
        font-weight: bold;
        border: none;
        border-radius: 20px;
        background-color: #2CD18A;
      }
    }
    .register-button {
      display: flex;
      justify-content: center;
      padding-top: 96px;
      .ant-btn {
        border: none;
        box-shadow: none;
        background-color: white;
        color: #06b650;
      }
    }
  }
}
</style>
