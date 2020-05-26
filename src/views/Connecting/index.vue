<template>
  <div class="connecting-content">
    <img src="../../assets/connecting_device_icon.png" class="connecting-icon">
    <img src="../../assets/connecting_gif.gif" class="connecting-gif">
    <label>正在连接设备...</label>
  </div>
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

export default Vue.extend({
  name: 'connecting',
  data () {
    return {
      loading: false
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('NasServer', ['nasInfo', 'accessInfo']),
    ...mapGetters('Login', ['connectionErrorCount']),
    sn: function () {
      let sn: string = this.$route.params.sn
      if (_.isEmpty(sn)) sn = (this.nasInfo as NasInfo).sn
      return sn
    },
    mac: function () {
      let mac: string = this.$route.params.mac
      if (_.isEmpty(mac)) mac = (this.nasInfo as NasInfo).mac
      return mac
    },
    secretKey: function () {
      let secretKey: string = this.$route.params.secretKey
      if (_.isEmpty(secretKey)) secretKey = (this.accessInfo as NasAccessInfo).key
      return secretKey
    }
  },
  mounted () {
    if (this.checkParams()) {
      this.searchNasInLAN()
    } else {
      this.pushFailedPage(ConnectionErrorType.missParams)
    }
  },
  destroyed () {
    ClientAPI.closeBoardcast()
  },
  methods: {
    checkParams () {
      if (_.isEmpty(this.sn)) {
        console.log(`sn paramter is undefined`)
        return false
      }
      if (_.isEmpty(this.mac)) {
        console.log(`mac paramter is undefined`)
        return false
      }
      if (_.isEmpty(this.secretKey)) {
        console.log(`secretKey paramter is undefined`)
        return false
      }
      return true
    },
    searchNasInLAN () {
      this.loading = true
      ClientAPI.searchNas(this.sn, this.mac, data => {
        ClientAPI.closeBoardcast()
        this.onlineConnectNas(data)
      }, error => {
        this.loading = false
        ClientAPI.closeBoardcast()
        this.pushFailedPage(ConnectionErrorType.notFound)
        console.log(error)
      })
      
      // ClientAPI.scanNas(data => {
      //   if (data.sn === this.sn && data.mac === this.mac) {
      //     this.loading = false
      //     window.clearTimeout(timerId as any)
      //     ClientAPI.closeBoardcast()
      //     this.onlineConnectNas(data)
      //   }
      // }, error => {
      //   this.loading = false
      //   ClientAPI.closeBoardcast()
      //   this.pushFailedPage(ConnectionErrorType.scanFailed)
      //   console.log(error)
      // })
    },
    onlineConnectNas (nasInfo: NasInfo) {
      ClientAPI.setBaseUrl(`http://${nasInfo.ip}:${nasInfo.port}`)
      ClientAPI.login(this.user, this.secretKey).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) {
          const count = this.connectionErrorCount + 1
          this.$store.dispatch('Login/updateErrorCount', count)
          const type = count > 2 ? ConnectionErrorType.timesError : ConnectionErrorType.apiError
          this.pushFailedPage(type)
          return
        }
        const accessInfo = response.data.data as NasAccessInfo
        accessInfo.key = this.secretKey
        // caceh nas info and token
        this.$store.dispatch('NasServer/updateNasAccess', accessInfo)
        this.$store.dispatch('NasServer/updateNasInfo', nasInfo)
        processCenter.renderSend(EventName.home)
      }).catch(error => {
        console.log(error)
        this.loading = false
        const count = this.connectionErrorCount + 1
        this.$store.dispatch('Login/updateErrorCount', count)
        const type = count > 2 ? ConnectionErrorType.timesError : ConnectionErrorType.networkError
        this.pushFailedPage(type)
      })
    },
    pushFailedPage (type: ConnectionErrorType) {
      this.$router.push({
        name: 'connection-failed',
        params: { errorType: type }
      })
    }
  }
})
enum ConnectionErrorType {
  missParams = '0',
  scanFailed = '1',
  notFound = '2',
  apiError = '3',
  networkError = '4',
  timesError = '5' // 出现多次网络连接错误
}
export {
  ConnectionErrorType
}
</script>

<style lang="less" scoped>
.connecting-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  background-color: white;
  .connecting-icon {
    width: 104px;
    margin-top: 85px;
  }
  .connecting-gif {
    width: 140px;
    margin-top: 20px;
  }
  label {
    color: #666262;
    font-size: 18px;
    margin-top: 40px;
  }
}
</style>
