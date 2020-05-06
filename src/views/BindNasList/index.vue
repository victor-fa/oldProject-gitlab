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
        :listHeight="320"
        v-on:didSelectItem="didSelectItem"
      />
    </a-spin>
    <a-button @click="addAction">添加设备</a-button>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import NasDeviceList from '../ScanNas/NasDeviceList.vue'
import UserAPI from '../../api/UserAPI'
import { DeviceInfo } from '../../api/UserModel'
import StringUtility from '../../utils/StringUtility'
import ClientAPI from '../../api/ClientAPI'
import { NasInfo, NasAccessInfo } from '../../api/ClientModel'
import processCenter, { EventName } from '../../utils/processCenter'

let timeId: NodeJS.Timeout | null = null

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
  created () {
    this.getBindDevices()
  },
  computed: {
    ...mapGetters('User', ['user'])
  },
  methods: {
    getBindDevices () {
      this.loading = true
      UserAPI.fetchBindDevices().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.deviceList = _.get(response.data.data, 'userDevices') as DeviceInfo[]
        // cache device list
        this.$store.dispatch('User/updateNasDevices', this.deviceList)
      }).catch((error: any) => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    didSelectItem (index: number) {
      const item = this.deviceList[index]
      const secretKey = StringUtility.filterPublicKey(item.publicKey)
      this.searchNasInLAN(item, secretKey)
    },
    searchNasInLAN (nas: DeviceInfo, secretKey: string) {
      timeId = this.beginTimer()
      this.loading = true
      ClientAPI.searchNas(nas.sn, nas.mac, data => {
        timeId !== null && clearTimeout(timeId)
        ClientAPI.closeBoardcast()
        this.loginToNas(data, secretKey)
      }, error => {
        this.loading = false
        timeId !== null && clearTimeout(timeId)
        ClientAPI.closeBoardcast()
      })
    },
    beginTimer () {
      return setTimeout(() => {
        ClientAPI.closeBoardcast()
        this.loading = false
        this.$message.error('连接超时')
      }, 10000)
    },
    loginToNas (nas: NasInfo, secretKey: string) {
      ClientAPI.setBaseUrl(`http://${nas.ip}:${nas.port}`)
      ClientAPI.login(this.user, secretKey).then(response => {
        console.log(response)
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
    margin: 40px 0px 35px 40px;
  }
  .ant-btn {
    height: 40px;
    color: white;
    font-size: 15px;
    font-weight: bold;
    border: none;
    border-radius: 20px;
    margin: 50px 75px 0px;
    background-image: linear-gradient(to right, #29cb7a, #4de9b9);
  }
}
</style>
