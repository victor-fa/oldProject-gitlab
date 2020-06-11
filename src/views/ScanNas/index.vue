<template>
  <div class="scan-nas">
    <div v-if="scanLoading" class="scan-animation">
      <img src="../../assets/scan_animation.gif">
      <span>正在扫描...</span>
    </div>
    <div
      v-else
      class="nas-content"
      @click="handleContentClick"
    >
      <span class="nas-title">扫描设备列表</span>
      <a-spin :spinning="connectLoading" style="flex: 1">
        <nas-device-list
          ref="nasDeviceList"
          :dataSource="nasList"
          :listHeight="listHeight"
          v-on:didSelectItem="didSelectItem"
        />
      </a-spin>
      <a-button @click="handleBackAction">{{ backBtnTitle }}</a-button>
      <auth-code-modal
        ref="authCodeModal"
        v-on:connectCallback="handleBindAction"
      />
      <account-modal
        ref="accountModal"
        v-on:offlienLogin="handleOfflineLogin"
        v-on:qrcodeLogin="handleQrcodeLogin"
      />
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import NasDeviceList from './NasDeviceList.vue'
import AuthCodeModal from './AuthCodeModal.vue'
import AccountModal from './AccountModal.vue'
import ClientAPI from '@/api/ClientAPI'
import { NasInfo, NasActive, NasAccessInfo, NasUser } from '@/api/ClientModel'
import processCenter, { EventName } from '@/utils/processCenter'
import { User, BasicResponse, DeviceRole, DeviceInfo } from '@/api/UserModel'
import router from '@/router'
import axios, { AxiosResponse } from 'axios'
import StringUtility from '@/utils/StringUtility'

export default Vue.extend({
  name: 'scan-nas',
  components: {
    NasDeviceList,
    AuthCodeModal,
    AccountModal
  },
  data () {
    return {
      scanLoading: true,
      nasList: [] as NasInfo[],
      selectNas: {} as NasInfo,
      connectLoading: false,
      listHeight: 0
    }
  },
  computed: {
    ...mapGetters('User', ['user', 'nasDevices']),
    type: function () {
      const type = this.$route.query.type as string
      return type
    },
    backBtnTitle: function () {
      if (this.type === 'offlineLogin') {
        return 'Cloud账号登录'
      }
      return '绑定设备列表'
    }
  },
  mounted () {
    this.scanNasInLan()
    this.bind()
  },
  destroyed () {
    ClientAPI.closeBoardcast()
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
    scanNasInLan () {
      this.scanLoading = true
      ClientAPI.scanNas(data => {
        this.scanLoading = false
        const nasList = _.clone(this.nasList)
        nasList.push(data)
        this.nasList = _.uniqBy(nasList, 'sn')
      }, error => {
        this.scanLoading = false
        this.$router.push({
          name: 'connection-failed',
          params: {
            error: '扫描出错',
            type: 'scanFailed',
            scanType: this.type
          }
        })
      })
    },
    didSelectItem (index: number) {
      const item = this.nasList[index]
      this.selectNas = item
      if (this.type === 'offlineLogin') {
        const accountModal = this.$refs.accountModal as any
        accountModal.show()
      } else {
        const nas = this.isBindDevice(item)
        nas === null ? this.notBindConnect(item) : this.boundContent(nas)
      }
    },
    // 判断当前设备用户是否已绑定
    isBindDevice (nas: NasInfo) {
      const boundDevices = this.nasDevices as DeviceInfo[]
      for (let index = 0; index < boundDevices.length; index++) {
        const item = boundDevices[index]
        if (item.sn === nas.sn) return item
      }
      return null
    },
    // 已绑定设备连接
    boundContent (nas: DeviceInfo) {
      const basrUrl = `http://${this.selectNas.ip}:${this.selectNas.port}`
      ClientAPI.setBaseUrl(basrUrl)
      const user = this.user as User
      const secretKey = StringUtility.filterPublicKey(nas.publicKey)
      this.connectLoading = true
      ClientAPI.login(user, secretKey).then(response => {
        this.connectLoading = false
        if (response.data.code !== 200) return
        const accessInfo = response.data.data as NasAccessInfo
        accessInfo.key = secretKey
        // caceh nas info and token
        this.$store.dispatch('NasServer/updateNasAccess', accessInfo)
        this.$store.dispatch('NasServer/updateNasInfo', this.selectNas)
        processCenter.renderSend(EventName.home)
      }).catch(error => {
        this.handleConnectFailure(error)
      })
    },
    // 未绑定设备连接
    notBindConnect (nas: NasInfo) {
      const basrUrl = `http://${nas.ip}:${nas.port}`
      ClientAPI.setBaseUrl(basrUrl)
      if (nas.active === NasActive.notBind) {
        // adminstrator bind
        this.bindUserToNas()
      } else {
        // normal user bind
        const authCodeModal = this.$refs.authCodeModal as any
        !_.isEmpty(authCodeModal) && authCodeModal.show()
      }
    },
    handleBindAction (code: string) {
      this.bindUserToNas(code)
    },
    handleOfflineLogin (account: string, password: string) {
      const baserUrl = `http://${this.selectNas.ip}:${this.selectNas.port}`
      ClientAPI.setBaseUrl(baserUrl)
      this.offlineLogin(account, password)
    },
    handleQrcodeLogin () {
      const basrUrl = `http://${this.selectNas.ip}:${this.selectNas.port}`
      ClientAPI.setBaseUrl(basrUrl)
      this.$router.push({
        name: 'qr-code-login',
        params: { type: 'offline', nasInfo: JSON.stringify(this.selectNas) }
      })
    },
    handleBackAction () {
      if (this.type === 'offlineLogin') {
        this.$router.replace('login')
      } else {
        this.$router.replace('bind-device-list')
      }
    },
    bindUserToNas (authCode?: string) {
      if (!this.checkCacheUser()) return
      console.log('begin bind user to nas')
      this.connectLoading = true
      ClientAPI.bindUser(this.user, authCode).then(response => {
        console.log(response)
        this.connectLoading = false
        if (response.data.code !== 200) return
        const data = response.data.data as NasAccessInfo
        // cache nas access info
        data.key = StringUtility.filterPublicKey(data.key)
        this.$store.dispatch('NasServer/updateNasAccess', data)
        // cache nas info 
        this.$store.dispatch('NasServer/updateNasInfo', this.selectNas)
        // cache new bind nas device
        this.$store.dispatch('User/addNasDevice', this.selectNas)
        // switch home window
        processCenter.renderSend(EventName.home)
      }).catch(error => {
        this.handleConnectFailure(error)
      })
    },
    // 离线账号登录接口
    offlineLogin (account: string, password: string) {
      const encryptPwd = StringUtility.encryptPassword(password)
      this.connectLoading = true
      ClientAPI.offlineLogin(account, encryptPwd).then(response => {
        console.log(response)
        this.connectLoading = false
        if (response.data.code !== 200) return
        const nasAccess = response.data.data as NasAccessInfo
        // cache nas access info
        this.$store.dispatch('NasServer/updateNasAccess', nasAccess)
        // cache nas info 
        this.$store.dispatch('NasServer/updateNasInfo', this.selectNas)
        // cache user info
        const user = this.convertUser(nasAccess.data)
        this.$store.dispatch('User/updateUser', user)
        // switch home window
        processCenter.renderSend(EventName.home)
      }).catch(error => {
        this.handleConnectFailure(error)
      })
    },
    convertUser (nasUser: NasUser) {
      return {
        birthday: nasUser.birthday,
        email: nasUser.email,
        nickName: nasUser.nic_name,
        phoneNo: nasUser.phone_no,
        sex: nasUser.sex,
        ugreenNo: nasUser.ugreen_no,
        versionNo: nasUser.version
      } as User
    },
    checkCacheUser () {
      if (_.isEmpty(this.user)) {
        console.log('not found cache user')
        this.$message.error('未找到本地缓存的用户信息')
        return false
      }
      return true
    },
    handleConnectFailure (error) {
      console.log(error)
      if (axios.isCancel(error)) return
      this.connectLoading = false
      this.$message.error('网络连接错误，请检测网络')
    },
    handleContentClick () {
      const list = this.$refs.nasDeviceList as any
      !_.isEmpty(list) && list.resetSelectedItem()
    }
  }
})
</script>

<style lang="less" scoped>
.scan-nas {
  height: 100%;
  .scan-animation {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
      margin-top: 80px;
      width: 346px;
    }
    span {
      margin-top: 36px;
      color: #666262;
      font-size: 19px;
    }
  }
  .nas-content {
    display: flex;
    flex-direction: column;
    .nas-title {
      width: 100%;
      text-align: left;
      font-size: 23px;
      color: #353535;
      font-weight: bold;
      margin: 40px 0px 35px 40px;
    }
    .ant-btn {
      align-self: center;
      margin-top: 10px;
      width: 130px;
      border: none;
      box-shadow: none;
      background-color: white;
      color: #06b650;
    }
  }
}
</style>
