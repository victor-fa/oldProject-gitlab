<template>
  <div class="encrypt-resource-view">
    <main-view
      :busy="busy"
      :loading="loading"
      :count="totalSize"
      :dataSource="dataArray"
      :funcList="showFuncList"
      :showToolbars="showToolbars"
      :contextListMenu="showListMenu"
      :contextItemMenu="showItemMenu"
      v-on:headerCallbackActions="handleHeaderActions"
      v-on:listCallbackActions="handleListActions"
      v-on:itemCallbackActions="handleItemActions"
      v-on:contextMenuCallbackActions="handleContextMenuActions"
    />
    <select-file-path v-if="showSelectModal" v-on:dismiss="handleSelectModalDismiss"/>
    <modify-password v-if="showModifyModal" v-on:dismiss="handleModifyDismiss"/>
    <reset-encrypt-space v-if="showResetModal" v-on:dismiss="handleResetDismiss"/>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import SelectFilePath from '../SelectFilePath/index.vue'
import ModifyPassword from './ModifyPassword/index.vue'
import ResetEncryptSpace from './ResetEncryptSpace/index.vue'
import { encryptContextMenu, encryptResourceContextMenu } from '@/components/OperateListAlter/operateList'
import { ResourceItem, OrderType, ResourceType } from '@/api/NasFileModel'
import RouterUtility from '@/utils/RouterUtility'
import NasFileAPI, { maxSize, TaskMode } from '../../api/NasFileAPI'
import { BasicResponse, User } from '../../api/UserModel'
import ResourceHandler from '../MainView/ResourceHandler'
import { commonFuncList, toolbars } from '../MainView/ResourceFuncList'
import EncryptDownloadTask from '../../api/Transport/EncryptDownloadTask'
import { downloadQueue, uploadQueue } from '../../api/Transport/TransportHelper'
import { TaskStatus } from '../../api/Transport/BaseTask'
import EncryptUploadTask from '../../api/Transport/EncryptUploadTask'
import StringUtility from '../../utils/StringUtility'
import { EventBus, EventType } from '../../utils/eventBus'

export default Vue.extend({
  name: 'encrypt-resource-view',
  mixins: [MainViewMixin],
  components: {
    MainView,
    SelectFilePath,
    ModifyPassword,
    ResetEncryptSpace
  },
  data () {
    return {
      page: 1,
      busy: false,
      totalSize: 0,
      loading: false,
      showSelectModal: false,
      showModifyModal: false,
      showResetModal: false,
      order: OrderType.byNameDesc,
      dataArray: [] as ResourceItem[],
      showFuncList: _.cloneDeep(commonFuncList),
      showListMenu: _.cloneDeep(encryptContextMenu),
      showItemMenu: _.cloneDeep(encryptResourceContextMenu),
      delayTimer: null as NodeJS.Timer | null
    }
  },
  computed: {
    ...mapGetters('NasServer', ['cryptoInfo', 'isLogined']),
    ...mapGetters('User', ['user']),
    showToolbars: function () {
      return toolbars.map(item => {
        item.disable = false
        return item
      })
    },
    path: function () {
      const path = this.$route.query.path as string
      if (!_.isEmpty(path)) return path
      const user = this.user as User
      return `/.ugreen_nas/${user.ugreenNo}/.safe`
    },
    uuid: function () {
      const uuid = this.$route.query.uuid as string
      if (!_.isEmpty(uuid)) return uuid
      return undefined
    }
  },
  watch: {
    $route: {
      handler: function () {
        this.checkQuery() && this.updateView()
      }
    }
  },
  mounted () {
    this.updateView()
    EventBus.$on(EventType.reloginEncrypt, this.handleReloginAction)
    uploadQueue.addListener('taskStatusChange', this.handleTaskStatusChange)
  },
  destroyed () {
    EventBus.$off(EventType.reloginEncrypt, this.handleReloginAction)
    uploadQueue.removeListener('taskStatusChange', this.handleTaskStatusChange)
    this.logoutEncryptSpace()
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer)
      this.delayTimer = null
    }
  },
  methods: {
    updateView () {
      this.dataArray = [] // 新的界面，需要清空缓存的数据
      this.handleRefreshAction()
    },
    checkQuery () {
      if (this.$route.name !== 'encrypt-resource-view') return false
      if (_.isEmpty(this.path)) return false
      return true
    },
    handleReloginAction (msg: string) {
      this.$router.replace('login-view')
    },
    getEncryptList() {
      this.loading = true
      NasFileAPI.getEncryptList(this.path, this.uuid, this.page, this.order).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    parseResponse (data: BasicResponse) {
      this.totalSize = _.get(data.data, 'total')
      let list = _.get(data.data, 'list') as ResourceItem[]
      if (_.isEmpty(list) || list.length < maxSize) this.busy = true
      list = ResourceHandler.formatResourceList(list)
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    logoutEncryptSpace () {
      NasFileAPI.logoutEncrypt().then(response => {
        console.log(response)
        this.$store.dispatch('NasServer/updateLoginStatus', false)
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
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
    // 重写父类中的方法
    handleRefreshAction () {  // 刷新
      this.page = 1
      this.busy = false
      this.getEncryptList()
    },
    handlePopAction (index: number) {
      RouterUtility.pop(index + 1)
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
    handleSortWayChangeAction (order: OrderType) {
      this.order = order
      this.page = 1
      this.busy = false
      this.getEncryptList()
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
    handleModifyPassAction () { // 修改加密空间密码
      this.showModifyModal = true
    },
    handleModifyDismiss () {
      this.showModifyModal = false
    },
    handleResetAction () { // 重置加密空间
      this.showResetModal = true
    },
    handleResetDismiss () {
      this.showResetModal = false
    },
    handleOpenFileAction (item: ResourceItem) {
      const myThis: any = this
      let OpenType = item.type
      const filterArr = [1, 2, 3]; // 0: Unknown 1: Video, 2: Audio, 3:Image, 4:Document, 5:Archive, 6:Folder
      if (filterArr.indexOf(OpenType) > -1) {
        let data = [{
          data: item,
          encrypt: this.cryptoInfo.crypto_token
        }]
        myThis.$ipc.send('file-control', OpenType, data);
      } else if (OpenType === 4) {
        let data:any = []
        data.push({
          data: item,
          encrypt: this.cryptoInfo.crypto_token
        })
        const filterFile = ['.zip', '.rar', '.7z', '.arj', '.gz', '.iso', '.z', '.ppt', '.pptx', '.xls', '.xlsx', '.doc', '.docx']
        const filterRes = filterFile.filter(item => data[0].data.path.toLowerCase().indexOf(item) > -1)
        const isPDF = data[0].data.path.indexOf('.pdf') > -1 || data[0].data.path.indexOf('.PDF') > -1  // 过滤PDF
        if (filterRes.length > 0) {
          this.$message.warning('请下载到电脑后再打开')
          return
        }
        myThis.$ipc.send('file-control', isPDF ? 5 : OpenType, data);
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
      this.showSelectModal = true
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
        this.handleRefreshAction()
      }).catch(error => {
        console.log(error)
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('移出失败')
      })
    },
    handleDropAction (paths: string[]) {
      this.handleUploadAction(paths)
    },
    handleUploadAction (filePaths: string[]) {
      filePaths.forEach(path => {
        const uuid = this.uuid === undefined ? '' : this.uuid
        const task = new EncryptUploadTask(path, this.path, uuid)
        task.matchTaskIcon()
        uploadQueue.addTask(task)
        this.$store.dispatch('Resource/increaseTask')
      })
    },
    handleRenameRequestAction (index: number, newName: string) {
      if (!ResourceHandler.checkFileName(newName)) {
        this.$message.error('名称包含非法字符')
        return
      }
      const item = ResourceHandler.getFirstSelectItem(this.dataArray)
      if (item === null) return
      this.loading = true
      const newPath = StringUtility.renamePath(item.path, newName)
      NasFileAPI.renameEncryptResource(item.path, newPath, item.uuid).then(response => {
        console.log(response)
        this.loading = false
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        item.path = newPath
        item.name = newName
        this.dataArray.splice(index, 1, item)
      }).catch(error => {
        console.log(error)
        this.loading = false
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

<style lang="less" scoped>
.encrypt-resource-view {
  height: 100%;
  width: 100%;
}
</style>
