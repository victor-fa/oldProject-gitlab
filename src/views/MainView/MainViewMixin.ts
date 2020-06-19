// main view mixins，主要处理mainview中可能会被重写的事件
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import ResourceHandler from './ResourceHandler'
import { ResourceItem, OrderType, ResourceType, ShareStatus, CollectStatus } from '@/api/NasFileModel'
import NasFileAPI, { TaskMode } from '@/api/NasFileAPI'
import { EventName } from '@/utils/processCenter'
import { EventBus } from '@/utils/eventBus'
import StringUtility from '@/utils/StringUtility'
import DownloadTask from '@/api/Transport/DownloadTask'
import { downloadQueue } from '@/api/Transport/TransportHelper'
import RouterUtility from '@/utils/RouterUtility'

let tmpArray: ResourceItem[] | null = null

export default Vue.extend({
  data () {
    return {
      order: OrderType.byNameDesc,
      loading: false,
      dataArray: [] as ResourceItem[]
    }
  },
  computed: {
    ...mapGetters('Resource', ['clipboard']),
    ...mapGetters('Resource', ['itemCount'])
  },
  methods: {
    // 更新当前展示的数据源
    updateShowArray (items: ResourceItem[]) {
      const childerns = this.$children
      for (let index = 0; index < childerns.length; index++) {
        const element = childerns[index]
        const name = element.$options.name
        if (name === 'main-view' && element.hasOwnProperty('updateShowArray')) {
          (element as any).updateShowArray(items)
          break
        }
      }
    },
    // handle header view callback actions
    handleHeaderActions (action: string, ...args: any[]) {
      switch (action) {
        case 'tabChange': 
          this.handleTabChange(args[0])
          break;
        case 'search':
          tmpArray = this.dataArray
          this.handleSearchAction(args[0])
          break;
        case 'endSearch':
          this.handleEndSerchAction()
          break;
        case 'refresh':
          this.handleRefreshAction()
          break;
        case 'sortWayChange':
          this.handleSortWayChangeAction(args[0])
          break;
        case 'newCustom':
          this.handleNewCustomAction()
          break;
        default:
          break;
      }
    },
    handleTabChange (type: ResourceType) {
      const items = ResourceHandler.classifyArray(this.dataArray, type)
      this.updateShowArray(items)
    },
    handleSearchAction (keyword: string) {
      this.dataArray = ResourceHandler.searchShowArray(this.dataArray, keyword)
    },
    handleEndSerchAction () {
      tmpArray !== null && (this.dataArray = tmpArray)
    },
    handleRefreshAction () {
    },
    handleSortWayChangeAction (order: OrderType) {
      this.order = order
      this.dataArray = ResourceHandler.orderShowArray(this.dataArray, order)
    },
    // handle resource list view callback actions
    handleListActions (action: string, ...args: any[]) {
      switch (action) {
        case 'loadmore':
          this.handleLoadmoreAction()
          break
        case 'drop':
          this.handleDropAction(args[0])
          break
        case "delelteItems":
          this.handleDeleteItems()
          break
        default:
          break;
      }
    },
    handleLoadmoreAction () {
    },
    handleDropAction (paths: string[]) {
    },
    handleDeleteItems () {
      this.handleDeletAction()
    },
    handleItemActions (action: string, index: number, ...args: any[]) {
      switch (action) {
        case 'enterRenaming':
          this.handleEnterRenaming(index)
          break;
        case 'leaveRenaming':
          this.handleLeaveRenaming(index)
          break
        case 'renameRequest':
          this.handleRenameRequestAction(index, args[0])
          break
        case 'leaveNewFolder':
          this.handleLeaveNewFolder(index)
          break
        case 'newFolderRequest':
          this.handleNewFolderRequestAction(index, args[0])
          break;
        default:
          break;
      }
    },
    handleEnterRenaming (index: number) {
      const item = this.dataArray[index]
      if (item.disable === true || item.renaming === true) return
      item.renaming = true
      this.dataArray.splice(index, 1, item)
    },
    handleLeaveRenaming (index: number) {
      const item = this.dataArray[index]
      item.renaming = false
      this.dataArray.splice(index, 1, item)
    },
    handleRenameRequestAction (index: number, newName: string) {
      if (!ResourceHandler.checkFileName(newName.substring(0, newName.indexOf('.')))) {
        this.$message.error('名称包含非法字符')
        return
      }
      const item = ResourceHandler.disableFirstSelectItem(this.dataArray)
      if (item === undefined) return
      const newPath = StringUtility.renamePath(item.path, newName)
      NasFileAPI.renameResource(item.path, newPath, item.uuid).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('重命名成功')
        item.path = newPath
        item.name = newName
        this.dataArray.splice(index, 1, item)
      }).catch(error => {
        console.log(error)
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('重命名失败')
      })
    },
    handleLeaveNewFolder (aIndex: number) {
      this.dataArray = this.dataArray.filter((item, index) => {
        if (index > aIndex) item.index = index - 1
        return index !== aIndex
      })
    },
    handleNewFolderRequestAction (index: number, newName: string) {
    },
    // handle main view context menu actions
    handleContextMenuActions (command: string, ...args: any[]) {
      switch (command) {
        case 'open': 
          this.handleOpenAction()
          break;
        case 'jump':
          this.handleJumpAction()
          break;
        case 'download':
          this.handleDownloadAction(args[0])
          break;
        case 'share':
          this.handleShareAction()
          break;
        case 'unshare':
          this.handleUnshareAction()
          break;
        case 'collect':
          this.handleCollection()
          break;
        case 'uncollect':
          this.handleUnCollectAction()
          break;
        case 'copy': 
          this.handleClipboardAction(false)
          break;
        case 'cut':
          this.handleClipboardAction()
          break;
        case 'delete':
          this.handleDeletAction()
          break;
        case 'rename':
          this.handleRenameAction()
          break;
        case 'info':
          this.handleInfoAction()
          break;
        case 'upload':
          this.handleUploadAction(args[0])
          break;
        case 'newFolder':
          this.handleNewFolderAction()
          break;
        case 'newCustom':
          this.handleNewCustomAction()
          break;
        case 'clearClipboard':
          this.clearClipboardAction()
          break;
        case 'paste':
          const mode = ResourceHandler.matchTaskMode(args[0])
          this.handlePasteAction(mode)
          break;
        case 'refresh':
          this.handleRefreshAction()
          break;
        case 'directoryInfo':
          this.handleDireactoryInfoAction()
          break;
        case 'loginEncrypt':
          this.handleLoginEncryptAction()
          break;
        case 'modifyPass':
          this.handleModifyPassAction()
          break;
        case 'reset':
          this.handleResetAction()
          break;
        case 'moveout':
          this.handleMoveoutAction()
          break;
        case 'modify':
          this.handleModifyAction()
          break;
        case 'recovery':
          this.handleRecoveryAction()
          break;
        case 'clearTrash':
          this.handleClearTrashAction()
          break;
        default:
          break;
      }
    },
    handleOpenAction () {
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      let srcItem = items[0]
      if (srcItem !== undefined) {
        srcItem.type === ResourceType.folder ? this.handleOpenFolderAction(srcItem) : this.handleOpenFileAction(srcItem)
      }
      this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
    },
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(item.name, 'main-resource-view', { path, uuid })
    },
    handleOpenFileAction (item: ResourceItem) {
      const myThis: any = this
      let OpenType = item.type
      const filterArr = [1, 2, 3]; // 0: Unknown 1: Video, 2: Audio, 3:Image, 4:Document, 5:Archive, 6:Folder
      if (filterArr.indexOf(OpenType) > -1) {
        let data:any = []
        data.push(item)
        myThis.$ipc.send('file-control', OpenType, data);
      } else if (OpenType === 4) {  // 普通文档、zip、pdf
        let data:any = []
        data.push(item)
        const filterCompress = ['.zip', '.ZIP', '.rar', '.RAR', '.7z', '.7Z', '.arj', '.ARJ', '.gz', '.GZ', '.iso', '.ISO', '.z', '.Z']
        const compressRes = filterCompress.filter(item => data[0].path.indexOf(item) > -1)  // 过滤压缩
        const isPDF = data[0].path.indexOf('.pdf') > -1 || data[0].path.indexOf('.PDF') > -1  // 过滤PDF
        if (compressRes.length > 0) {
          this.$message.warning('暂不支持打开该类型文件')
          return
        }
        myThis.$ipc.send('file-control', isPDF ? 5 : OpenType, data);
      } else {
        this.$message.warning('暂不支持打开该类型文件');
      }
    },
    handleJumpAction () {
      const item = ResourceHandler.getFirstSelectItem(this.dataArray)
      if (item === null) return
      EventBus.$emit(EventName.jump, item)
    },
    handleDownloadAction (directory: string[]) {
      const destPath = directory[0]
      const items = ResourceHandler.getSelectItems(this.dataArray)
      items.forEach(item => {
        const task = new DownloadTask(item.path, destPath, item.uuid)
        task.setResourceItem(item)
        downloadQueue.addTask(task)
        this.$store.dispatch('Resource/increaseTask')
      })
    },
    handleShareAction () {
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      NasFileAPI.shareResource(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('分享成功')
        ResourceHandler.setShareState(this.dataArray, ShareStatus.has)
      }).catch(error => {
        console.log(error)
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('分享失败')
      })
    },
    handleUnshareAction () {
    },
    handleCollection () {
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      NasFileAPI.collectFile(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('收藏成功')
        ResourceHandler.setCollectState(this.dataArray, CollectStatus.has)
      }).catch(error => {
        console.log(error)
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('收藏失败')
      })
    },
    handleUnCollectAction () {
    },
    handleClipboardAction (isClip: boolean = true) {
      const info = isClip ? '文件已剪切到剪切板' : '文件已复制到剪切板'
      this.$message.info(info)
      const items = ResourceHandler.getSelectItems(this.dataArray)
      this.$store.dispatch('Resource/updateClipboard', { isClip: isClip, items })
    },
    handleDeletAction () {
      // 删除选中的正在命名中的items
      this.dataArray = this.dataArray.filter(item => {
        return !(item.renaming === true && item.isSelected === true)
      })
      const items = ResourceHandler.getSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      this.handleDeletRequest(items)
    },
    handleDeletRequest (items: ResourceItem[]) {
      this.loading = true
      NasFileAPI.deleteFile(items).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
      }).catch(error => {
        console.log(error)
        this.$message.error('删除失败')
        this.loading = false
      })
    },
    handleRenameAction () {
      const index = ResourceHandler.getFirstSelectItemIndex(this.dataArray)
      if (index === undefined) return
      this.handleEnterRenaming(index)
    },
    handleInfoAction () {
      const _this = this as any
      const items = ResourceHandler.getSelectItems(this.dataArray)
      if (_.isEmpty(items) || items.length > 1) return
      const item = items[0]
      _this.$ipc.send('file-control', 0, item)
    },
    clearClipboardAction () {
      this.$store.dispatch('Resource/updateClipboard', { isClip: false, items: [] })
      this.$message.info('剪切板已清空')
    },
    handleNewCustomAction () {
    },
    handleUploadAction (filePaths: string[]) {
    },
    handleNewFolderAction () {
    },
    handlePasteAction (mode: TaskMode) {
    },
    handleDireactoryInfoAction () {
    },
    handleLoginEncryptAction () {
    },
    handleModifyPassAction () {
    },
    handleResetAction () {
    },
    handleMoveoutAction () {
    },
    handleModifyAction () {
    },
    handleRecoveryAction () {
    },
    handleClearTrashAction () {
    }
  }
})
