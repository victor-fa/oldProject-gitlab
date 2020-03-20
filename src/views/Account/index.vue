<template>
  <div class="offline-account">
    <h2>设置离线账号与密码</h2>
    <basic-form
      :icon="loginIcons.account"
      placeholder="请输您入账号"
      v-model="account"
    />
    <basic-form
      :icon="loginIcons.password"
      placeholder="请输入您的密码"
      v-model="password"
      isSecure="ture"
    />
    <basic-form
      :icon="loginIcons.password"
      placeholder="确认密码"
      v-model="confirmPassword"
      isSecure="ture"
    />
    <a-button
      block
      :loading="loading"
      @click="confirmAction"
    >
      设置账号
    </a-button>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import  BasicForm from '../../components/BasicForm/index.vue'
import { User } from '../../api/UserModel'
import ClientAPI from '../../api/ClientAPI'
import { NasAccessInfo } from '../../api/ClientModel'
import processCenter, { EventName } from '../../utils/processCenter'
import { loginIcons } from '../Login/iconList'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'account',
  components: {
    BasicForm
  },
  data () {
    return {
      loginIcons,
      loading: false,
      account: '',
      password: '',
      confirmPassword: ''
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('NasServer', ['nasInfo'])
  },
  mounted () {
    // 账号最大长度为64字节
  },
  methods: {
    confirmAction () {
      const checkResult = this.checkInput()
      if (!_.isEmpty(checkResult)) {
        this.$message.error(checkResult)
        return
      }
      this.setAccount(this.account, StringUtility.encryptPassword(this.password))
    },
    checkInput () {
      if (_.isEmpty(this.account)) return '请输入账号'
      if (_.isEmpty(this.password)) return '请输入密码'
      if (_.isEmpty(this.confirmPassword)) return '请输入确认密码'
      if (this.account.length > 64) return '账号不能超过40个字符'
      if (this.password !== this.confirmPassword) return '两次密码输入不一致'
      return null
    },
    setAccount (account: string, password: string) {
      if (!this.checkCacheInfo()) return
      this.loading = true
      const apiToken = (this.nasInfo as NasAccessInfo).api_token
      ClientAPI.setOfflineAccount(account, password, apiToken).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        processCenter.renderSend(EventName.home)
      }).catch(error => {
        this.loading = false
        console.log(error)
      })
    },
    checkCacheInfo () {
      if (_.isEmpty(this.user)) {
        console.log('not found cache user')
        this.$message.error('未找到本地缓存的用户信息')
        return false
      }
      if (_.isEmpty(this.nasInfo)) {
        console.log('not found caceh nas info')
        this.$message.error('未找到本地缓存的api_token')
        return false
      }
      return true
    }
  }
})
</script>

<style lang="less" scoped>
.offline-account {
  padding: 44px 20px;
  .ant-btn {
    margin-top: 40px;
    height: 40px;
    color: white;
    font-size: 15px;
    font-weight: bold;
    border: none;
    border-radius: 20px;
    background-image: linear-gradient(to right, #29cb7a, #4de9b9);
  }
}
</style>
