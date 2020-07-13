<template>
  <div class="encrypt">
    <main-view
      :busy="busy"
      :loading="loading"
      :count="totalSize"
      :dataSource="dataArray"
      :funcList="showFuncList"
      :showToolbars="showToolbars"
      :contextListMenu="showListMenu"
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
      <a-input v-focus type="password" placeholder="请输入加密空间密码" v-model="encryptLogin.securityPassword" v-on:pressEnter="login()"/>
    </a-modal>
    <a-modal
      width="360px" style="top: 120px;"
      :visible="encryptModify.isVisiable" :mask="false" :closable="false" :maskClosable="false"
      okText="确定" cancelText="取消" @ok="handleEncryptModify" @cancel="cancleEncryptModify">
      <p class="modal-title">修改密码</p>
      <p><a-input v-focus type="password" placeholder="请输入旧密码" v-model="encryptModify.oldPassword" /></p>
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
import NasFileAPI, { TaskMode, maxSize } from '@/api/NasFileAPI'
import EncryptUploadTask from '@/api/Transport/EncryptUploadTask'
import EncryptDownloadTask from '@/api/Transport/EncryptDownloadTask'
import { TaskError, TaskStatus } from '@/api/Transport/BaseTask'
import { uploadQueue, downloadQueue } from '@/api/Transport/TransportHelper'
import { ResourceItem, OrderType, UploadTimeSort, ResourceType } from '@/api/NasFileModel'
import { User, BasicResponse } from '@/api/UserModel'
import StringUtility from '@/utils/StringUtility'
import { encryptActiveContextMenu, encryptContextMenu, encryptMisTokenContextMenu, encryptResourceContextMenu } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'
import SelectFilePath from '../SelectFilePath/index.vue'
import { toolbars, commonFuncList } from '../MainView/ResourceFuncList'
import { EventBus, EventType } from '../../utils/eventBus'

export default Vue.extend({
  name: 'encrypt',
  directives: {
    focus: {
      inserted: function (el) {
        el.focus()
      }
    }
  },
  components: {
    MainView,
    SelectFilePath
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
      dataArray: [] as ResourceItem[],
      totalSize: 0,
      page: 1,
      busy: false,
      alreadyLogin: false,  // 是否已登录
      order: OrderType.byNameDesc, // 上传列表的排序方式
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
      showListMenu: _.cloneDeep(encryptActiveContextMenu), // list右键菜单选项
      encryptResourceContextMenu, // item右键菜单选项
      showSelectModal: false, // 控制路径选择弹窗的显示与隐藏
      delayTimer: null as NodeJS.Timer | null
    }
  },
  computed: {
    ...mapGetters('NasServer', ['cryptoInfo', 'isLogined']),
    ...mapGetters('User', ['user']),
    showFuncList: function () {
      return _.cloneDeep(commonFuncList).map(item => {
        item.disable = !(this.isLogined as boolean)
        return item
      })
    },
    showToolbars: function () {
      return _.cloneDeep(toolbars).map(item => {
        item.disable = !(this.isLogined as boolean)
        return item
      })
    },
    path: function () {
      const user = this.user as User
      return `/.ugreen_nas/${user.ugreenNo}/.safe`
    },
    uuid: function () {
      return undefined
    }
  },
  mounted () {
    if (this.isLogined === true) {
      this.getEncryptList()
    } else {
      this.checkEncryptStatus()
    }
    EventBus.$on(EventType.reloginEncrypt, this.handleReloginAction)
  },
  destroyed () {
    if (this.isLogined === true) {
      const encryptNames = ['encrypt-resource-view', 'encrypt']
      const name = this.$route.name
      if (_.isString(name) && encryptNames.indexOf(name) === -1) {
        this.logout()
      }
    }
    EventBus.$off(EventType.reloginEncrypt, this.handleReloginAction)
    uploadQueue.removeListener('taskStatusChange', this.handleTaskStatusChange)
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer)
      this.delayTimer = null
    }
  },
  methods: {
    handleReloginAction (msg: string) {
      this.$store.dispatch('NasServer/updateLoginStatus', false)
      this.encryptLogin.isVisiable = true
    },
    checkEncryptStatus() {
      NasFileAPI.getEncryptStatus().then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        const status = _.get(response.data.data, 'status') as number
        if (status === 0) {
          this.encryptSet.isVisiable = true
        } else {
          this.encryptLogin.isVisiable = true
          this.showListMenu = _.cloneDeep(encryptMisTokenContextMenu)
        }
      }).catch(error => {
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
        const resCode = response.data.code
        if (resCode !== 200) {
          let msg = ''
          if (resCode === 8031) {
            msg = '密码错误，请重试'
          } else if (resCode === 8032) {
            msg = '您未激活加密空间'
            this.encryptLogin.isVisiable = false
            this.encryptSet.isVisiable = true
          }
          this.$message.error(msg)
          return
        }
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
        this.$store.dispatch('NasServer/updateLoginStatus', true)
        this.showListMenu = _.cloneDeep(encryptContextMenu)
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
      NasFileAPI.getEncryptList(this.path, undefined, this.page, this.order).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
         this.parseResponse(response.data)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络错误，请检查网络')
      })
    },
    parseResponse (data: BasicResponse) {
      this.totalSize = _.get(data.data, 'total')
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < maxSize) this.busy = true
      list = ResourceHandler.formatResourceList(list)
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    logout () {
      NasFileAPI.logoutEncrypt().then(response => {
        console.log(response)
        this.$store.dispatch('NasServer/updateLoginStatus', false)
        this.loading = false
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
      RouterUtility.push(name, 'encrypt-resource-view', { path, uuid })
    },
    handleLoadmoreAction () {
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
        this.checkEncryptStatus()
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
        const task = new EncryptDownloadTask(item.path, destPath, item.uuid)
        task.setResourceItem(item)
        downloadQueue.addTask(task)
        this.$store.dispatch('Resource/increaseTask')
      })
    },
    handleSortWayChangeAction (order: OrderType) {
      this.order = order
      this.page = 1
      this.busy = false
      this.getEncryptList()
    },
    handleActiveEncryptAction () {  // 激活加密空间
      this.encryptSet.isVisiable = true
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
      console.log(OpenType);
      const filterArr = [1, 2, 3]; // 0: Unknown 1: Video, 2: Audio, 3:Image, 4:Document, 5:Archive, 6:Folder
      if (filterArr.indexOf(OpenType) > -1) {
        let data:any = []
        data.push(item)
        myThis.$ipc.send('file-control', OpenType, data);
      } else if (OpenType === 4) {
        let data:any = []
        data.push(item)
        const filterFile = ['.zip', '.rar', '.7z', '.arj', '.gz', '.iso', '.z', '.ppt', '.pptx', '.xls', '.xlsx', '.doc', '.docx']
        const filterRes = filterFile.filter(item => data[0].path.toLowerCase().indexOf(item) > -1)
        if (filterRes.length > 0) {
          this.$message.warning('请下载到电脑后再打开')
          return
        }
        myThis.$ipc.send('file-control', OpenType, data);
      } else {
        this.$message.warning('请下载到电脑后再打开');
      }
    },
    handleDeletRequest (items: ResourceItem[]) {
      this.loading = true
      NasFileAPI.addEncryptRemoveTask(items).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.$store.dispatch('Resource/increaseTask')
        this.dataArray = this.dataArray.filter(item => {
          return items.indexOf(item) === -1
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('删除失败')
      })
    },
    handleMoveoutAction () {
      const items = ResourceHandler.getSelectItems(this.dataArray)
      this.showSelectModal = true
      console.log(JSON.parse(JSON.stringify(items)));
    },
    handleDropAction (paths: string[]) {
      this.handleUploadAction(paths)
    },
    handleUploadAction (filePaths: string[]) {
      filePaths.forEach(path => {
        const task = new EncryptUploadTask(path, this.path, '')
        task.matchTaskIcon()
        uploadQueue.addTask(task)
        uploadQueue.addListener('taskStatusChange', this.handleTaskStatusChange)
        this.$store.dispatch('Resource/increaseTask')
      })
    },
    handleTaskStatusChange (taskId: number) {
      const task = uploadQueue.searchTask(taskId)
      if (task === undefined) return
      if (task.status === TaskStatus.finished) {
        if (this.delayTimer !== null) clearTimeout(this.delayTimer)
        this.delayTimer = setTimeout(() => {
          this.handleRefreshAction()
          this.delayTimer = null
        }, 1000)
      } else if (task.status === TaskStatus.error) {
        this.$message.error(task.error!.desc)
      }
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
    },
    handlePasteAction (mode: TaskMode) {
      this.loading = true
      const srcItems = ResourceHandler.getSelectItems(this.dataArray)
      const ugreenNo = (this.user as User).ugreenNo
      NasFileAPI.addEncryptMoveIntoTask(srcItems, this.path, TaskMode.rename).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.handleRefreshAction()
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('移动失败')
      })
    },
    handleNewFolderAction () {
      const newName = ResourceHandler.calculateNewFolderName(this.dataArray)
      const newItem = {
        type: ResourceType.folder,
        isSelected: true,
        name: newName,
        renaming: true
      } as ResourceItem 
      this.dataArray = [newItem].concat(this.dataArray)
    },
    handleNewFolderRequestAction (index: number, newName: string) {
      if (!ResourceHandler.checkFileName(newName)) {
        this.$message.error('名称包含非法字符')
        return
      }
      this.loading = true
      const directory = `${this.path}/${newName}`
      NasFileAPI.newFolderEncrypt(directory, this.uuid).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.handleRefreshAction()
      }).catch(error => {
        console.log(error)
        this.$message.error('新建失败')
        this.loading = false
      })
    }
  }
})
</script>

<style scoped>
.encrypt {
  height: 100%;
}
.modal-title {
  text-align: center;
  display: block;
  font-size: 20px;
  font-weight: bold;
}
</style>
