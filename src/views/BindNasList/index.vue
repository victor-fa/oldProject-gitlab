<template>
  <div
    class="bind-device-list"
    @click="handleListClick"
  >
    <span class="list-title">绑定设备列表</span>
    <a-spin :spinning="loading">
      <nas-device-list
        ref="nasDeviceList"
        :dataSource="deviceList"
        :listHeight="listHeight"
        v-on:didSelectItem="didSelectItem"
      />
    </a-spin>
    <a-button class="add-device-btn" @click="addAction">添加设备</a-button>
    <a-button class="back-login-btn" @click="handleBackClick">重新登录</a-button>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import NasDeviceList from '../ScanNas/NasDeviceList.vue'
import UserAPI from '@/api/UserAPI'
import { DeviceInfo } from '@/api/UserModel'
import StringUtility from '@/utils/StringUtility'
import ClientAPI from '@/api/ClientAPI'
import { nasServer } from '@/api/NasServer';
import TunnelAPI from '@/api/TunnelAPI'
import { NasInfo, NasAccessInfo } from '@/api/ClientModel'
import processCenter, { EventName } from '@/utils/processCenter'

export default Vue.extend({
  name: 'bind-device-list',
  components: {
    NasDeviceList
  },
  data () {
    return {
      loading: false,
      deviceList: [] as DeviceInfo[],
      currentDevice: 0,
      listHeight: 0
    }
  },
  mounted () {
    this.getBindDevices()
    this.bind()
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('NasServer', ['nasInfo']),
    autoLogin: function () {
      const flag = (this.$route.params.autoLogin === 'true') as boolean
      return flag
    }
  },
  methods: {
    bind () {
      this.listHeight = document.body.clientHeight - 250
      window.onresize = () => {
        const _this = this as any
        return (() => {
          _this.listHeight = document.body.clientHeight - 250
        })();
      };
    },
    getBindDevices () {
      this.loading = true
      UserAPI.fetchBindDevices().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.deviceList = _.get(response.data.data, 'userDevices') as DeviceInfo[]
        // cache device list
        this.$store.dispatch('User/updateNasDevices', this.deviceList)
        if (this.autoLogin) this.handleAutoLogin()
      }).catch((error: any) => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    didSelectItem (index: number) {
      this.currentDevice = index
      const item = this.deviceList[index]
      this.searchNas(item)
    },
    handleAutoLogin () {
      let device = this.deviceList[0]
      const cacheNas = this.nasInfo as NasInfo
      this.deviceList.forEach(item => {
        if (item.sn === cacheNas.sn) device = item
      })
      this.searchNas(device)
    },
    searchNas (nas: DeviceInfo) {
      this.loading = true
      ClientAPI.searchNas(nas.sn, nas.mac).then(data => {
        const secretKey = StringUtility.filterPublicKey(nas.publicKey)
        this.loginToNas(data, secretKey)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('连接失败')
      })
    },
    loginToNas (nas: NasInfo, secretKey: string) {
      ClientAPI.setBaseUrl(`http://${nas.ip}:${nas.port}`)
      ClientAPI.login(this.user, secretKey).then(response => {
        console.log(response.data)
        this.loading = false
        if (response.data.code !== 200) return
        const accessInfo = response.data.data as NasAccessInfo
        accessInfo.key = secretKey
        // caceh nas info and token
        this.$store.dispatch('NasServer/updateNasAccess', accessInfo)
        this.$store.dispatch('NasServer/updateNasInfo', nas)
        processCenter.renderSend(EventName.home)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接失败，请检查网络')
      })
    },
    addAction () {
      this.$router.push({
        name: 'scan-nas',
        query: { type: 'addDevice' }
      })
    },
    handleBackClick () {
      this.$router.replace('login')
    },
    handleListClick () {
      const list = this.$refs.nasDeviceList as any
      !_.isEmpty(list) && list.resetSelectedItem()
    }
  }
})
</script>

<style lang="less" scoped>
.bind-device-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  .list-title {
    width: 100%;
    text-align: left;
    font-size: 23px;
    color: #353535;
    font-weight: bold;
    margin: 30px 0px 25px 40px;
  }
  .add-device-btn {
    height: 40px;
    color: white;
    font-size: 15px;
    font-weight: bold;
    border: none;
    border-radius: 20px;
    margin: 15px 75px 0px;
    background-image: linear-gradient(to right, #29cb7a, #4de9b9);
  }
  .back-login-btn {
    align-self: center;
    margin-top: 10px;
    width: 130px;
    border: none;
    box-shadow: none;
    background-color: white;
    color: #06b650;
  }
}
</style>
