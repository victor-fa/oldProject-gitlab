<template>
  <div>
    <main-view
      :loading="loading"
      :currentPath="currentPath"
      :dataSource="dataArray"
      :contextListMenu="encryptContextMenu"
      :contextItemMenu="encryptResourceContextMenu"
      v-on:headerCallbackActions="handleHeaderActions"
      v-on:listCallbackActions="handleListActions"
      v-on:itemCallbackActions="handleItemActions"
      v-on:contextMenuCallbackActions="handleContextMenuActions"
    />
    <a-modal
      width="360px" style="top: 120px;"
      :visible="encryptSet.isVisiable" :mask="false" :closable="false" :maskClosable="false"
      okText="确定" cancelText="取消" @ok="handleEncryptSet" @cancel="cancleEncryptSet">
      <p class="modal-title">激活加密空间</p>
      <p>请务必记住您的密码！</p>
      <p>为保护您的加密数据安全，系统不会自动记录您的登陆密码。一旦遗忘，将无法通过任何方式打开加密文件。</p>
      <p><a-checkbox v-model="encryptSet.alreadyKnow">我已经了解</a-checkbox></p>
      <p><a-input type="password" placeholder="请输入加密空间密码" v-model="encryptSet.securityUserPassword" /></p>
      <a-input type="password" placeholder="请再次输入加密空间密码" v-model="encryptSet.securityUserPasswordRepeat" />
    </a-modal>
    <a-modal
      width="360px" style="top: 120px;"
      :visible="encryptLogin.isVisiable" :mask="false" :closable="false" :maskClosable="false"
      okText="确定" cancelText="取消" @ok="login" @cancel="cancleEncryptLogin">
      <p class="modal-title">输入加密密码</p>
      <a-input type="password" placeholder="请输入加密空间密码" v-model="encryptLogin.securityPassword" />
    </a-modal>
    <a-modal
      width="360px" style="top: 120px;"
      :visible="encryptModify.isVisiable" :mask="false" :closable="false" :maskClosable="false"
      okText="确定" cancelText="取消" @ok="handleEncryptModify" @cancel="cancleEncryptModify">
      <p class="modal-title">修改密码</p>
      <p><a-input type="password" placeholder="请输入旧密码" v-model="encryptModify.oldPassword" /></p>
      <p><a-input type="password" placeholder="请输入新密码" v-model="encryptModify.newPassword" /></p>
      <a-input type="password" placeholder="请再次输入新密码" v-model="encryptModify.repeatPassword" />
    </a-modal>
    <a-modal
      width="360px" style="top: 120px;"
      :visible="encryptReset.isVisiable" :mask="false" :closable="false" :maskClosable="false"
      okText="确定" cancelText="取消" @ok="handleEncryptReset" @cancel="cancleEncryptReset">
      <p class="modal-title">重置加密空间</p>
      <p>此操作将会清除加密空间所有文件，并注销您原来的密码！一旦重置，您可重新激活使用加密空间。</p>
      <a-checkbox v-model="encryptReset.alreadyKnow">我已经了解</a-checkbox>
    </a-modal>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import ResourceHandler from '../MainView/ResourceHandler'
import NasFileAPI from '../../api/NasFileAPI'
import { ResourceItem, OrderType, UploadTimeSort } from '../../api/NasFileModel'
import StringUtility from '../../utils/StringUtility'
import { encryptContextMenu, encryptResourceContextMenu } from '../../components/OperateListAlter/operateList'

export default Vue.extend({
  name: 'encrypt',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  computed: {
    ...mapGetters('NasServer', ['cryptoInfo'])
  },
  created() {
    this.checkEncryptStatus()
  },
  destroyed() {
    this.logout()
  },
  data () {
    return {
      loading: false,
      currentPath: '加密',
      dataArray: [],
      page: 1,
      busy: false,
      uploadOrder: UploadTimeSort.descend, // 上传列表的排序方式
      encryptSet: {
        isVisiable: false,
        alreadyKnow: false,
        securityUserPassword: '',
        securityUserPasswordRepeat: ''
      },
      encryptLogin: {
        isVisiable: false,
        securityPassword: ''
      },
      encryptModify: {
        isVisiable: false,
        oldPassword: '',
        newPassword: '',
        repeatPassword: ''
      },
      encryptReset: {
        isVisiable: false,
        alreadyKnow: false
      },
      encryptContextMenu, // list右键菜单选项
      encryptResourceContextMenu // item右键菜单选项
    }
  },
  methods: {
    checkEncryptStatus() {
      this.loading = true
      NasFileAPI.getEncryptStatus().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        if (_.get(response.data.data, 'status') === 0) {
          this.encryptSet.isVisiable = true
        } else {
          this.encryptSet.isVisiable = false
          this.getEncryptList()
        }
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    handleEncryptSet() {
      if (!this.encryptSet.alreadyKnow) {
        this.$message.warning('请先勾选已了解')
        return false
      }
      if (!this.encryptSet.securityUserPassword.length) {
        this.$message.warning('请输入加密空间密码')
        return false
      }
      if (!this.encryptSet.securityUserPasswordRepeat.length) {
        this.$message.warning('请再次输入加密空间密码')
        return false
      }
      if (this.encryptSet.securityUserPassword !== this.encryptSet.securityUserPasswordRepeat) {
        this.$message.warning('两次输入的密码不一样，请检查')
        return false
      }
      this.loading = true
      NasFileAPI.setEncrypt(StringUtility.encryptPassword(this.encryptSet.securityUserPassword)).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.login()
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    cancleEncryptSet() {
      this.encryptSet = {
        isVisiable: false,
        alreadyKnow: false,
        securityUserPassword: '',
        securityUserPasswordRepeat: ''
      }
    },
    cancleEncryptLogin() {
      this.encryptLogin = {
        isVisiable: false,
        securityPassword: ''
      }
    },
    cancleEncryptModify() {
      this.encryptModify = {
        isVisiable: false,
        oldPassword: '',
        newPassword: '',
        repeatPassword: ''
      }
    },
    cancleEncryptReset() {
      this.encryptReset = {
        isVisiable: false,
        alreadyKnow: false
      }
    },
    login() {
      let security_password = ''
      if (this.encryptSet.isVisiable) {
        security_password = StringUtility.encryptPassword(this.encryptSet.securityUserPassword)
      } else if (this.encryptLogin.isVisiable) {
        security_password = StringUtility.encryptPassword(this.encryptLogin.securityPassword)
      } else if (this.encryptModify.isVisiable) {
        security_password = StringUtility.encryptPassword(this.encryptModify.newPassword)
      }
      this.loading = true
      NasFileAPI.loginEncrypt(security_password).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        if (this.encryptSet.isVisiable) {
          this.$message.success('激活成功')
          this.cancleEncryptSet()
        } else if (this.encryptLogin.isVisiable) {
          this.$message.success('登录成功')
          this.cancleEncryptLogin()
        } else if (this.encryptModify.isVisiable) {
          this.$message.success('修改成功')
          this.cancleEncryptModify()
        }
        const crypto_token = _.get(response.data, 'data')
        crypto_token.security_password = security_password
        this.$store.dispatch('NasServer/updateCryptoInfo', crypto_token)
        this.getEncryptList()
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    handleEncryptModify() {
      if (!this.encryptModify.oldPassword.length) {
        this.$message.warning('请输入旧密码')
        return false
      }
      if (!this.encryptModify.newPassword.length) {
        this.$message.warning('请输入新密码')
        return false
      }
      if (!this.encryptModify.repeatPassword.length) {
        this.$message.warning('请再次输入新密码')
        return false
      }
      if (this.encryptModify.newPassword !== this.encryptModify.repeatPassword) {
        this.$message.warning('两次输入的密码不一样，请检查')
        return false
      }
      const input = {
        security_user_password: StringUtility.encryptPassword(this.encryptModify.oldPassword),
        security_user_password_new: StringUtility.encryptPassword(this.encryptModify.newPassword)
      }
      this.loading = true
      NasFileAPI.modifyEncrypt(input).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.login()
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    handleEncryptReset() {
      if (!this.encryptReset.alreadyKnow) {
        this.$message.warning('请先勾选已了解')
        return false
      }
      this.loading = true
      NasFileAPI.resetEncrypt().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        console.log(response);
        // TODO: 当前加密空间重置接口还没好
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    getEncryptList() {
      this.loading = true
      NasFileAPI.getEncryptList().then(response => {
        this.loading = false
        if (response.data.code !== 200) {
          if (response.data.code === 4004) {  // 针对Resource Not Found
            this.dataArray = []
            return
          }
          this.encryptLogin.isVisiable = true // 弹出登录窗口
          return
        }
        let list = _.get(response.data.data, 'list')
        if (_.isEmpty(list) || list.length < 20) this.busy = true
        list = ResourceHandler.formateResponseList(list)
        this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
        this.encryptLogin.isVisiable = true
      })
    },
    logout () {
      NasFileAPI.logoutEncrypt().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        console.log(response);
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    // 重写父类中的方法
    handleRefreshAction () {  // 刷新
      this.page = 1
      this.busy = false
      this.getEncryptList()
    },
    handleLoadmoreAction () {
      this.page++
      this.getEncryptList()
    },
    handleSortWayChangeAction (order: OrderType) {
      if (order === OrderType.ByUploadDesc) {
        this.uploadOrder = UploadTimeSort.descend
      } else if (order === OrderType.ByUploadAsc) {
        this.uploadOrder = UploadTimeSort.ascend
      }
      this.page = 1
      this.busy = false
      this.getEncryptList()
    },
    handleModifyPassAction () { //  修改加密空间密码
      this.encryptModify.isVisiable = true
    },
    handleResetAction () {  // 重置加密空间
      this.encryptReset.isVisiable = true
    },
    handleOpenFileAction (item: ResourceItem) {
      const myThis: any = this
      let OpenType = item.type
      const filterArr = [1, 2, 3, 4]; // 0: Unknown 1: Video, 2: Audio, 3:Image, 4:Document, 5:Archive, 6:Folder
      if (filterArr.indexOf(OpenType) > -1) {
        let data:any = []
        data.push(item)
        myThis.$ipc.send('file-control', OpenType, data);
      } else if (OpenType === 5) {	// 包含zip
        let data:any = []
        data.push(item)
        const filterCompress = ['.zip', '.rar', '.7z', '.ZIP', '.RAR', '.7Z']
        const compressRes = filterCompress.filter(item => data[0].path.indexOf(item) > -1)
        if (compressRes.length === 0) {	// pdf
          myThis.$ipc.send('file-control', OpenType, data);
        }
      } else {
        this.$message.warning('暂不支持打开该类型文件');
      }
    },
    // handleContextMenuActions (command: string, ...args: any[]) {
    //   switch (command) {
    //     case 'upload': 
    //     case 'delete': 
    //     case 'rename': 
    //     case 'remove': 
    //     case 'info': 
    //     default:
    //   }
    // }
  }
})
</script>

<style scoped>
.modal-title {
  text-align: center;
  display: block;
  font-size: 20px;
  font-weight: bold;
}
</style>
