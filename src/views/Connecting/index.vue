<template>
  <div class="connecting-content">设备连接中...</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import processCenter, { EventName } from '../../utils/processCenter'
import { AccessToken, User } from '../../api/UserModel'
import { EventBus } from '../../utils/eventBus'
import ClientAPI from '../../api/ClientAPI'
import { NasInfo, NasAccessInfo } from '../../api/ClientModel'
import NasFileAPI from '../../api/NasFileAPI'

let timerId: NodeJS.Timeout | null = null
export default Vue.extend({
  name: 'connecting',
  data () {
    return {
      loading: false,
      sn: this.$route.params.sn,
      mac: this.$route.params.mac,
      secretKey: this.$route.params.secretKey
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('NasServer', ['nasInfo'])
  },
  mounted () {
    this.searchNasInLAN()
  },
  destroyed () {
    if (timerId !== null) window.clearTimeout(timerId as any)
    ClientAPI.closeBoardcast()
  },
  methods: {
    searchNasInLAN () {
      timerId = this.beginTimer()
      this.loading = true
      // ClientAPI.searchNas(this.sn, this.mac, data => {
      //   if (data.sn === this.sn && data.mac === this.mac) {
      //     window.clearTimeout(timerId as any)
      //     this.onlineConnectNas(data)
      //   } 
      // }, error => {
      //   this.loading = false
      //   // TODO: 扫描当前设备失败，界面如何展示
      //   console.log(error)
      // })
      ClientAPI.scanNas(data => {
        if (data.sn === this.sn && data.mac === this.mac) {
          this.loading = false
          window.clearTimeout(timerId as any)
          ClientAPI.closeBoardcast()
          this.onlineConnectNas(data)
        }
      }, error => {
        this.loading = false
        // TODO: 扫描当前设备失败，界面如何展示
        console.log(error)
      })
    },
    beginTimer () {
      return setTimeout(() => {
        ClientAPI.closeBoardcast()
        this.loading = false
        // TODO: 未扫描到当前设备，界面如何展示
      }, 10000)
    },
    onlineConnectNas (nasInfo: NasInfo) {
      ClientAPI.setBaseUrl(`http://${nasInfo.ip}:${nasInfo.port}`)
      ClientAPI.login(this.user, this.secretKey).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) {
          console.log(response.data.msg)
          // TODO: 设备连接失败
          return
        }
        const accessInfo = response.data.data as NasAccessInfo
        accessInfo.key = this.secretKey
        // caceh nas info and token
        this.$store.dispatch('NasServer/updateNasAccess', accessInfo)
        this.$store.dispatch('NasServer/updateNasInfo', nasInfo)
        processCenter.renderSend(EventName.home)
      }).catch(error => {
        this.loading = false
        console.log(error)
        // TODO: 设备连接失败
      })
    }
  }
})
</script>

<style lang="less" scoped>
.connecting-content {
  color: black;
}
</style>
