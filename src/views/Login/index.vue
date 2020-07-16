<template>
  <div class="login">
    <ul class="content-wrapper">
      <li class="tip">帐号密码登录</li>
      <li class="account-form">
        <basic-form
          :icon="loginIcons.account"
          :maxLength=11
          :selectItems="showDropItems"
          placeholder="输入您的手机号"
          v-model="account"
          v-on:select="accountSelectAction"
          v-on:delete="accountDeleteAction"
          v-on:change="handleAccountChange"
        />
      </li>
      <li class="password-from">
        <basic-form
          :icon="loginIcons.password"
          :maxLength=16
          placeholder="输入您的密码"
          v-model="password"
          isSecure="ture"
          v-on:pressEnter="loginAction"
        />
      </li>
      <li class="password-checkbox">
        <a-checkbox :checked="rememberPassword" @change="checkboxChange">记住密码</a-checkbox>
        <a-button @click="changePassword">忘记密码</a-button>
        <a-button @click="handleRegisterAction">注册帐号</a-button>
      </li>
      <li class="login-button">
        <a-button
          block
          @click="loginAction"
          :loading="loading"
        >
          登录
        </a-button>
      </li>
      <li class="register-button">
        <a-button @click="codeLoginBtnClick">扫码登录</a-button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { loginIcons } from './iconList'
import BasicForm from '@/components/BasicForm/index.vue'
import UserAPI from '@/api/UserAPI'
import ClientAPI from '@/api/ClientAPI'
import { LoginResponse, Account, DeviceInfo, User } from '@/api/UserModel'
import { NasAccessInfo } from '@/api/ClientModel'
import processCenter, { EventName, MainEventName } from '@/utils/processCenter'
import { message } from 'ant-design-vue'
import { ACCESS_TOKEN, REMEMBER_PWD } from '@/common/constants'
import StringUtility from '@/utils/StringUtility'

export default Vue.extend({
  name: 'login',
  components: {
    BasicForm
  },
  data () {
    return {
      loginIcons,
      account: '',
      password: '',
      ciphertext: '',
      rememberPassword: true,
      forgetPass: {
        visiable: false
      },
      loading: false,
      showDropItems: [] as Account[]
    }
  },
  watch: {
    account: function (newValue: string) {
      if (_.isEmpty(newValue)) this.password = ''
    },
    password: function (newValue) {
      this.ciphertext = ''
    }
  },
  computed: {
    ...mapGetters('User', ['cacheAccounts', 'user']),
    ...mapGetters('NasServer', ['nasInfo'])
  },
  mounted () {
    this.clearCache()
    const value = localStorage.getItem(REMEMBER_PWD)
    this.rememberPassword = !(value === 'false')
    this.showDropItems = this.cacheAccounts
  },
  methods: {
    checkboxChange() {
      this.rememberPassword = !this.rememberPassword
      const value = this.rememberPassword ? 'true' : 'false'
      localStorage.setItem(REMEMBER_PWD, value)
    },
    handleRegisterAction() {
      this.$router.push('register')
    },
    clearCache () {
      // clear user cache
      this.$store.dispatch('User/clearCacheUserInfo')
      // clear nas cache
      this.$store.dispatch('NasServer/clearCacheNas')
    },
    codeLoginBtnClick () {
      this.$router.push({
        name: 'qr-code-login',
        params: { type: 'online' }
      })
    },
    loginAction () {
      if (!this.checkInputFrom()) return
      if (_.isEmpty(this.ciphertext)) this.ciphertext = StringUtility.encryptPassword(this.password)
      this.loading = true
      UserAPI.login(this.account, this.ciphertext).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        const loginResponse = response.data.data as LoginResponse
        this.cacheUserInfo(loginResponse)
        this.$router.push('bind-device-list')
      }).catch((error: any) => {
        console.log(error)
        this.loading = false
        this.showOfflineDialog()
      })
    },
    showOfflineDialog () {
      const { dialog } = require('electron').remote
      dialog.showMessageBox({
        title: '绿联云',
        message: '连接不上云帐号\n是否用本地帐号登录？',
        buttons: ['确定', '取消'],
        defaultId: 0,
        cancelId: 1
      }).then(result => {
        if (result.response !== 0) return
        this.$router.push({
          name: 'scan-nas',
          query: { type: 'offlineLogin' }
        })
      })
    },
    checkInputFrom () {
      if (this.account.length === 0) {
        this.$message.warning('请输入帐号')
        return false
      } else if (this.password.length === 0) {
        this.$message.warning('请输入密码')
        return false
      }
      return true
    },
    cacheUserInfo (response: LoginResponse) {
      this.$store.dispatch('User/updateUser', response.user)
      this.$store.dispatch('User/updateAccessToken', response.accessToken)
      if (!this.rememberPassword) return
      const account: Account = { account: this.account, password: this.ciphertext }
      this.$store.dispatch('User/addAccount', account)
    },
    accountSelectAction (item: Account) {
      this.account = item.account
      this.password = item.password
      this.$nextTick(() => {
        this.ciphertext = item.password
      })
    },
    accountDeleteAction (aItem: Account) {
      this.showDropItems = this.showDropItems.filter(item => {
        return item.account !== aItem.account
      })
      this.$store.dispatch('User/removeAccount', aItem.account)
    },
    handleAccountChange (value: string) {
      if (_.isEmpty(value)) {
        this.showDropItems = this.cacheAccounts
      } else {
        const items = this.cacheAccounts as Account[]
        this.showDropItems = items.filter((element: Account) => {
          const account = element.account.toLowerCase()
          const key = value.toLowerCase()
          if (key === account) return false
          return account.indexOf(key) !== -1
        })
      }
    },
		changePassword() {
			const _this = this as any
			_this.$ipc.send('system', 'forget-pass', 'login');
    }
  }
})
</script>

<style lang="less" scoped>
.login {
  height: 100%;
  background-color: #fdffff;
  display: flex;
  justify-content: center;
  .content-wrapper {
    width: 100%;
    padding: 0px 52px 0px 52px;
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
        font-size: 17px;
        font-weight: bold;
        color: #2cd18a;
      }
    }
  }
}
</style>
