<template>
  <div class="scan-nas">
    <h3>scan-nas</h3>
    <p>你还没有绑定设备，局域网扫描中</p>
    <ul>
      <li
        v-for="(item, index) in nasList"
        :key="index"
        @click="didSelectItem(item)"
      >
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import ClientAPI from '../../api/ClientAPI'
import { NasInfo, NasActive, NasAccessInfo } from '../../api/ClientModel'
import processCenter, { EventName } from '../../utils/processCenter'
import { User, BasicResponse, DeviceRole } from '../../api/UserModel'
import router from '../../router'

let selectItem: NasInfo | null = null
export default Vue.extend({
  name: 'scan-nas',
  data () {
    let list: Array<NasInfo> = []
    return {
      nasList: list,
      loading: false
    }
  },
  computed: {
    ...mapGetters('User', ['user'])
  },
  mounted () {
    console.log('begin scan')
    ClientAPI.scanNas(data => {
      this.nasList.push(data)
    }, error => {
      console.log(error)
    })
  },
  destroyed () {
    ClientAPI.closeBoardcast()
    selectItem = null
  },
  methods: {
    didSelectItem (item: NasInfo) {
      selectItem = item
      const basrUrl = `http://${item.ip}:${item.port}`
      this.bindConnect(basrUrl, item.active)
    },
    bindConnect (url: string, active: NasActive) {
      ClientAPI.setBaseUrl(url)
      if (active === NasActive.notBind) {
        // adminstrator
        this.bindUserToNas()
      } else {
        // normal user
        const authCode = '123'
        this.bindUserToNas(authCode)
      }
    },
    bindUserToNas (authCode: string = '') {
      if (!this.checkCacheUser()) return
      console.log('begin bind user to nas')
      this.loading = true
      ClientAPI.bindUser(this.user, authCode).then(response => {
        console.log(response)
        this.handleConnectSuccess(response.data)
      }).catch(error => {
        this.handleConnectFailure(error)
      })
    },
    accountContent (url: string) {
      if (!this.checkCacheUser()) return
      console.log('begin online login to nas')
      ClientAPI.setBaseUrl(url)
      this.loading = true
      const account = ''
      const password = ''
      const ugreenNo = (this.user as User).ugreenNo.toString()
      ClientAPI.offlineLogin(account, password, ugreenNo).then(response => {
        console.log(response)
        this.handleConnectSuccess(response.data)
      }).catch(error => {
        this.handleConnectFailure(error)
      })
    },
    checkCacheUser () {
      if (_.isEmpty(this.user)) {
        console.log('not found cache user')
        this.$message.error('未找到本地缓存的用户信息')
        return false
      }
      return true
    },
    handleConnectSuccess (response: BasicResponse) {
      this.loading = false
      if (response.code !== 200) {
        this.$message.error(response.msg)
        return
      }
      const data = response.data as NasAccessInfo
      // cache nas access info
      this.$store.dispatch('NasServer/updateNasAccess', data)
      // cache nas info 
      this.$store.dispatch('NasServer/updateNasInfo', selectItem)
      if (data.role === DeviceRole.admin) {
        // push Account page
        router.push('account')
      } else {
        // switch home window
        processCenter.renderSend(EventName.home)
      }
    },
    handleConnectFailure (error) {
      console.log(error)
      this.loading = false
      this.$message.error('网络连接错误，请检测网络')
    }
  }
})
</script>

<style lang="less" scoped>
.scan-nas {
  color: black;
}
</style>
