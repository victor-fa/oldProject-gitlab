<template>
  <div
    class="bind-device-list"
    @click="handleListClick"
  >
    <span class="list-title">绑定设备列表</span>
    <a-spin :spinning="loading">
      <nas-device-list
        ref="nasDeviceList"
        type="bind"
        :dataSource="deviceList"
        v-on:didSelectItem="didSelectItem"
        v-on:unbind="handleUnbindAction"
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
import { DeviceInfo, BasicResponse, DeviceStatus } from '@/api/UserModel'
import StringUtility from '@/utils/StringUtility'
import ClientAPI from '@/api/ClientAPI'
import { nasServer } from '@/api/NasServer';
import TunnelAPI from '@/api/TunnelAPI'
import { NasInfo, NasAccessInfo, NasActive } from '@/api/ClientModel'
import processCenter, { EventName } from '@/utils/processCenter'

export default Vue.extend({
  name: 'bind-device-list',
  components: {
    NasDeviceList
  },
  data () {
    return {
      loading: false,
      deviceList: [] as DeviceInfo[]
    }
  },
  mounted () {
    this.getBindDevices()
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
    getBindDevices () {
      this.loading = true
      UserAPI.fetchBindDevices().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch((error: any) => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    parseResponse (data: BasicResponse) {
      const list = _.get(data.data, 'userDevices') as DeviceInfo[]
      this.deviceList = list.sort((a, b) => {
        return a.status > b.status ? -1 : 1
      })
      // cache device list
      this.$store.dispatch('User/updateNasDevices', this.deviceList)
      if (this.autoLogin) this.handleAutoLogin()
    },
    didSelectItem (index: number) {
      const device = this.deviceList[index]
      this.searchNas(device)
    },
    handleUnbindAction (index: number) {
      this.loading = true
      const device = this.deviceList[index]
      UserAPI.unbindDevice(device).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.$message.info('解绑成功')
        this.deviceList.splice(index, 1)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('解绑失败')
      })
    },
    // 扫描自动登录
    handleAutoLogin () {
      const onlineDevices = this.deviceList.filter(item => {
        return item.status === DeviceStatus.online
      })
      if (_.isEmpty(onlineDevices)) return
      this.searchNas(onlineDevices[0])
    },
    searchNas (device: DeviceInfo) {
      this.loading = true
      ClientAPI.searchNas(device.sn, device.mac).then(data => { // 1. search nas
        const nas = this.complementNasInfo(device, data)
        this.$store.dispatch('NasServer/updateNasInfo', nas)
        ClientAPI.setBaseUrl(`http://${nas.ip}:${nas.port}`)
        return ClientAPI.login(this.user, device.publicKey)
      }).then(response => { // 2. login to nas
        console.log(response.data)
        this.loading = false
        if (response.data.code !== 200) return
        const accessInfo = response.data.data as NasAccessInfo
        accessInfo.key = device.publicKey
        this.$store.dispatch('NasServer/updateNasAccess', accessInfo)
        processCenter.renderSend(EventName.home)
      }).catch(error => { // 3. catch error
        console.log(error)
        this.loading = false
        this.$message.error('连接失败')
        this.getBindDevices()
      })
    },
    complementNasInfo (device: DeviceInfo, nas: NasInfo) {
      if (nas.ip === '127.0.0.1') {
        nas.name = device.name
        nas.model = device.model
        nas.active = NasActive.Bind
      }
      return nas
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
