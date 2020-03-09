<template>
  <div>设置账号密码</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { User } from '../../api/UserModel'
import ClientAPI from '../../api/ClientAPI'
import { NasAccessInfo } from '../../api/ClientModel'
import processCenter, { EventName } from '../../utils/processCenter'

export default Vue.extend({
  name: 'account',
  data () {
    return {
      loading: false
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
    setAccount (account: string, password: string) {
      if (!this.checkCacheInfo()) return
      this.loading = true
      const myThis = this
      const ugreenNo = (this.user as User).ugreenNo.toString()
      const apiToken = (this.nasInfo as NasAccessInfo).api_token
      ClientAPI.setOfflineAccount(account, password, apiToken, ugreenNo).then(response => {
        this.loading = false
        if (response.data.code !== 200) {
          myThis.$message.error(response.data.msg)
          return
        }
        console.log(response)
        processCenter.renderSend(EventName.home)
      }).catch(error => {
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

</style>
