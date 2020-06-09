<template>
  <div>
    <main-view
      :loading="loading"
      :dataSource="dataArray"
      :busy="busy"
      :contextListMenu="alreadyLogin ? encryptContextMenu : encryptMisTokenContextMenu"
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
      <a-input type="password" placeholder="请再次输入加密空间密码" v-model="encryptSet.securityUserPasswordRepeat" v-on:pressEnter="handleEncryptSet()"/>
    </a-modal>
    <a-modal
      width="360px" style="top: 120px;"
      :visible="encryptLogin.isVisiable" :mask="false" :closable="false" :maskClosable="false"
      okText="确定" cancelText="取消" @ok="login" @cancel="cancleEncryptLogin">
      <p class="modal-title">输入加密密码</p>
      <a-input type="password" placeholder="请输入加密空间密码" v-model="encryptLogin.securityPassword" v-on:pressEnter="login()"/>
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
    <select-file-path v-if="showSelectModal" v-on:dismiss="handleSelectModalDismiss"/>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import ResourceHandler from '../MainView/ResourceHandler'
import NasFileAPI, { TaskMode } from '@/api/NasFileAPI'
import EncryptUploadTask from '@/api/Transport/EncryptUploadTask'
import { encryptUploadQueue, encryptDownloadQueue } from '@/api/Transport/TransportQueue'
import EncryptDownloadTask from '@/api/Transport/EncryptDownloadTask'
import { ResourceItem, OrderType, UploadTimeSort } from '@/api/NasFileModel'
import StringUtility from '../../utils/StringUtility'
import { encryptContextMenu, encryptMisTokenContextMenu, encryptResourceContextMenu } from '../../components/OperateListAlter/operateList'
import { User } from '../../api/UserModel'
import RouterUtility from '../../utils/RouterUtility'
import SelectFilePath from '../SelectFilePath/index.vue'

export default Vue.extend({
  name: 'encrypt',
  components: {
    MainView,
    SelectFilePath
  },
  mixins: [MainViewMixin],
  computed: {
    ...mapGetters('NasServer', ['cryptoInfo']),
    ...mapGetters('User', ['user']),
    path: function () {
      const path = this.$route.query.path as string
      return path
    },
    uuid: function () {
      const uuid = this.$route.query.uuid as string
      return uuid
    },
  },
  mounted () {
    this.checkEncryptStatus()
    encryptUploadQueue.on('fileFinished', (task, fileInfo) => {  // 接收完成结果
      // this.$store.dispatch('Resource/decreaseTask')
      setTimeout(() => { this.getEncryptList() }, 1000);
    })
    console.log(this.alreadyLogin);
  },
  destroyed() {
    if (this.alreadyLogin === true) { // 已登录情况下才需要登录
      this.logout()
    }
  },
  data () {
    return {
      loading: false,
      dataArray: [] as any,
      page: 1,
      busy: false,
      uploadOrder: UploadTimeSort.descend, // 上传列表的排序方式
      alreadyLogin: false,  // 是否已登录
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
      encryptMisTokenContextMenu, // list未登录时，右键菜单选项
      encryptResourceContextMenu, // item右键菜单选项
      showSelectModal: false // 控制路径选择弹窗的显示与隐藏
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
    getEncryptList() {
      this.loading = true
      NasFileAPI.getEncryptList(`/.ugreen_nas/${(this.user as User).ugreenNo}/.safe`).then(response => {
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
        list = ResourceHandler.formatResourceList(list)
        this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
        this.alreadyLogin = true
      }).catch(error => {
        this.loading = false
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
    handleOpenFolderAction (item: ResourceItem) {
      const name = item.name
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(name, 'encrypt-reasource-view', { path, uuid })
    },
    handleLoadmoreAction () {
      if (this.busy) return
      this.page++
      this.getEncryptList()
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
        this.$message.success('重置加密空间成功')
        this.cancleEncryptReset()
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    handleDownloadAction (directory: string[]) {
      const destPath = directory[0]
      const items = ResourceHandler.getSelectItems(this.dataArray)
      items.forEach(item => {
        const task = new EncryptDownloadTask(item, destPath, item.uuid)
        encryptDownloadQueue.addTask(task)
        this.$store.dispatch('Resource/increaseTask')
      })
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
    handleLoginEncryptAction () { // 登录加密空间
      this.encryptLogin.isVisiable = true
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
    handleDeletRequest (items: ResourceItem[]) {
      ResourceHandler.disableSelectItems(this.dataArray)
      NasFileAPI.addEncryptRemoveTask(items).then(response => {
        if (response.data.code !== 200) return
        this.$store.dispatch('Resource/increaseTask')
        setTimeout(() => this.getEncryptList(), 2000);
      }).catch(_ => {
        this.$message.error('删除失败')
      })
    },
    handleMoveoutAction () {
      const items = ResourceHandler.getSelectItems(this.dataArray)
      this.showSelectModal = true
      console.log(JSON.parse(JSON.stringify(items)));
    },
    handleUploadAction (filePaths: string[]) {
      filePaths.forEach(path => {
        const task = new EncryptUploadTask(path, this.path, this.uuid)
        encryptUploadQueue.addTask(task)
        this.$store.dispatch('Resource/increaseTask')
      })
    },
    handleSelectModalDismiss (path?: string, uuid?: string) {
      this.showSelectModal = false
      if (path === undefined || uuid === undefined) return
      const srcItems = ResourceHandler.disableSelectItems(this.dataArray)
      const destItem = { path, uuid } as ResourceItem
      NasFileAPI.addEncryptMoveOutTask(srcItems, destItem, TaskMode.rename).then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.info('任务添加成功')
        this.$store.dispatch('Resource/increaseTask')
        this.$emit('headerCallbackActions', 'refresh')
      }).catch(error => {
        console.log(error)
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('移出失败')
      })
    },
    handleRenameRequestAction (index: number, newName: string) {
      if (!ResourceHandler.checkFileName(newName.substring(0, newName.indexOf('.')))) {
        this.$message.error('名称包含非法字符')
        return
      }
      const item = ResourceHandler.disableFirstSelectItem(this.dataArray)
      if (item === undefined) return
      const newPath = StringUtility.renamePath(item.path, newName)
      const route = this.$route.name as string
      NasFileAPI.renameEncryptResource(item.path, newPath, item.uuid, route).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        // this.$message.info('重命名成功')
        item.path = newPath
        item.name = newName
        this.dataArray.splice(index, 1, item)
      }).catch(error => {
        console.log(error)
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('重命名失败')
      })
    }
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
