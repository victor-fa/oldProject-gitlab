<template>
  <div class="login">
    <ul class="content-wrapper">
      <li class="tip">账号密码登录</li>
      <li class="account-form">
        <basic-form
          :icon="loginIcons.account"
          placeholder="用户名/手机号/邮箱"
          v-model="account"
          :selectItems="dropdownItems"
          v-on:change="accountChangeAction"
          v-on:select="accountSelectAction"
          v-on:delete="accountDeleteAction"
          @keyup.enter.native="loginAction"
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
        <a-checkbox :checked="rememberPassword" @change="checkboxChange">记住密码</a-checkbox>
        <a-button>忘记密码</a-button>
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
import BasicForm from '../../components/BasicForm/index.vue'
import UserAPI from '../../api/UserAPI'
import ClientAPI from '../../api/ClientAPI'
import { LoginResponse, Account, DeviceInfo, User } from '../../api/UserModel'
import { NasAccessInfo } from '../../api/ClientModel'
import processCenter, { EventName, MainEventName } from '../../utils/processCenter'
import { message } from 'ant-design-vue'
import { ACCESS_TOKEN } from '../../common/constants'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'login',
  components: {
    BasicForm
  },
  data () {
    let items: Account[] = []
    return {
      loginIcons,
      account: '',
      password: '',
      ciphertext: '',
      rememberPassword: false,
      dropdownItems: items,
      loading: false
    }
  },
  watch: {
    account: function (newValue: string) {
      if (_.isEmpty(newValue)) this.password = ''
      this.ciphertext = ''
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
    this.observerToastNotify()
    this.dropdownItems = _.cloneDeep(this.cacheAccounts)
    this.clearCache()
  },
  destroyed () {
    processCenter.removeRenderObserver(MainEventName.toast)
  },
  methods: {
    checkboxChange() {
      this.rememberPassword = !this.rememberPassword
    },
    clearCache () {
      // clear user cache
      this.$store.dispatch('User/clearCacheUserInfo')
      // clear nas cache
      this.$store.dispatch('NasServer/clearCacheNas')
    },
    observerToastNotify () {
      processCenter.renderObserver(MainEventName.toast, (event, message: string) => {
        this.$message.error(message)
      })
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
        message: '连接不上云账号\n是否用本地账号登录？',
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
        this.$message.warning('请输入账号', 1.5)
        return false
      } else if (this.password.length === 0) {
        this.$message.warning('请输入密码', 1.5)
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
    accountChangeAction (value: string) {
      this.dropdownItems = this.cacheAccounts.filter((element: Account) => {
        const account = element.account.toLowerCase()
        const keyword = value.toLowerCase()
        if (account === keyword) {
          return false
        }
        return account.indexOf(keyword) >= 0
      })
    },
    accountSelectAction (item: Account) {
      this.account = item.account
      this.password = item.password
      this.dropdownItems = []
      this.$nextTick(() => {
        this.ciphertext = item.password
      })
    },
    accountDeleteAction (item: Account) {
      for (let index = 0; index < this.dropdownItems.length; index++) {
        const element = this.dropdownItems[index]
        if (element.account === item.account) {
          this.dropdownItems.splice(index, 1)
          break
        }
      }
      this.$store.dispatch('User/removeAccount', item.account)
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
