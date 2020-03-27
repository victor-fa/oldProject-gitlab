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
        {{ item.name }}:{{ item.ip }}
      </li>
    </ul>
    <a-modal
      :visible="visible"
      :mask="false"
      :closable="false"
      :maskClosable="false"
      okText="连接"
      cancelText="取消"
      @ok="handleOk"
      :confirmLoading="bindLoading"
      @cancel="handleCancel"
    >
      邀请码:
      <a-input
        placeholder="请输入邀请码"
        v-model="authCode"
      />
    </a-modal>
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
import axios, { AxiosResponse } from 'axios'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'scan-nas',
  data () {
    let list: Array<NasInfo> = []
    let item: any = null
    return {
      nasList: list,
      bindLoading: false,
      visible: false,
      authCode: 'UGREEN',
      selectNas: item
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
    // temporary code
    setTimeout(() => {
      const nasInfo: NasInfo = {
        name: '小明的设备',
        model: 'NAS-D2P1',
        mac: '00ce39ca56a1',
        sn: '1000000002',
        port: 9999,
        ip: '192.168.10.91',
        softversion: 'V1.0.0',
        active: NasActive.Bind
      }
      this.nasList.push(nasInfo)
    }, 2000);
  },
  destroyed () {
    ClientAPI.closeBoardcast()
  },
  methods: {
    didSelectItem (item: NasInfo) {
      this.selectNas = item
      const basrUrl = `http://${item.ip}:${item.port}`
      this.bindConnect(basrUrl)
    },
    bindConnect (url: string) {
      ClientAPI.setBaseUrl(url)
      const active = (this.selectNas as NasInfo).active
      if (active === NasActive.notBind) {
        // adminstrator bind
        this.bindUserToNas()
      } else {
        // normal user bind
        this.visible = true
      }
    },
    handleOk () {
      const authCode = this.authCode
      this.bindUserToNas(authCode)
    },
    handleCancel () {
      ClientAPI.cancelBindRequest()
      this.visible = false
      this.bindLoading = false
    },
    bindUserToNas (authCode: string = '') {
      if (!this.checkCacheUser()) return
      console.log('begin bind user to nas')
      this.bindLoading = true
      ClientAPI.bindUser(this.user, authCode).then(response => {
        this.handleConnectSuccess(response)
      }).catch(error => {
        this.handleConnectFailure(error)
      })
    },
    accountContent (url: string) {
      if (!this.checkCacheUser()) return
      console.log('begin offline login to nas')
      ClientAPI.setBaseUrl(url)
      this.bindLoading = true
      const account = ''
      const password = StringUtility.encryptPassword('password')
      ClientAPI.offlineLogin(account, password).then(response => {
        // TODO: 离线登录应该返回公钥，如果用户在其它设备上进行了离线登录，此时是没法获取到设备公钥的
        this.handleConnectSuccess(response)
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
    handleConnectSuccess (response: AxiosResponse<BasicResponse>) {
      console.log(response)
      this.bindLoading = false
      if (response.data.code !== 200) return
      const data = response.data.data as NasAccessInfo
      // cache nas access info
      data.key = StringUtility.filterPublicKey(data.key)
      this.$store.dispatch('NasServer/updateNasAccess', data)
      // cache nas info 
      this.$store.dispatch('NasServer/updateNasInfo', this.selectNas)
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
      if (axios.isCancel(error)) return
      this.bindLoading = false
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
