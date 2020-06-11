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
import processCenter, { EventName } from '@/utils/processCenter'
import { AccessToken, User } from '@/api/UserModel'
import { EventBus } from '@/utils/eventBus'
import ClientAPI from '@/api/ClientAPI'
import { NasInfo, NasAccessInfo } from '@/api/ClientModel'
import NasFileAPI from '@/api/NasFileAPI'

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
      this.pushFailedPage()
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
      ClientAPI.searchNas(this.sn, this.mac).then(data => {
        console.log(data)
        this.onlineConnectNas(data)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.pushFailedPage()
      })
    },
    onlineConnectNas (nasInfo: NasInfo) {
      ClientAPI.setBaseUrl(`http://${nasInfo.ip}:${nasInfo.port}`)
      ClientAPI.login(this.user, this.secretKey).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) {
          this.pushFailedPage()
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
        this.pushFailedPage()
      })
    },
    pushFailedPage () {
      this.$router.push({
        name: 'connection-failed',
        params: {
          error: '连接失败',
          type: 'connectionFaild'
        }
      })
    }
  }
})
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
