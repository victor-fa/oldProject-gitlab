// main view mixins，主要处理mainview中可能会被重写的事件
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import ResourceHandler from './ResourceHandler'
import { ResourceItem, OrderType, ResourceType, ShareStatus, CollectStatus } from '@/api/NasFileModel'
import NasFileAPI, { TaskMode } from '@/api/NasFileAPI'
import processCenter, { EventName } from '@/utils/processCenter'
import { EventBus } from '@/utils/eventBus'
import StringUtility from '@/utils/StringUtility'

// declare module 'vue/types/vue' {
//   interface Vue {
//     handleHeaderActions (action: string, ...args: any[]): void
//     handleListActions (action: string, ...args: any[]): void
//     handleContextMenuActions (command: string, ...args: any[]): void
//   }
// }

export default Vue.extend({
  data () {
    return {
      dataArray: [] as ResourceItem[],
      currentPath: ''
    }
  },
  computed: {
    ...mapGetters('Resource', ['clipboard']),
    ...mapGetters('Resource', ['itemCount'])
  },
  methods: {
    // handle header view callback actions
    handleHeaderActions (action: string, ...args: any[]) {
      switch (action) {
        case 'back':
          this.handleBackAction()
          break;
        case 'search':
          this.handleSearchAction(args[0])
          break;
        case 'refresh':
          this.handleRefreshAction()
          break;
        case 'sortWayChange':
          this.handleSortWayChangeAction(args[0])
          break;
        default:
          break;
      }
    },
    handleBackAction () {
      this.$router.go(-1)
    },
    handleSearchAction (keyword: string) {
      this.dataArray = ResourceHandler.searchShowArray(this.dataArray, keyword)
    },
    handleRefreshAction () {
    },
    handleSortWayChangeAction (order: OrderType) {
      this.dataArray = ResourceHandler.orderShowArray(this.dataArray, order)
    },
    // handle resource list view callback actions
    handleListActions (action: string, ...args: any[]) {
      switch (action) {
        case 'loadmore':
          this.handleLoadmoreAction()
          break;
        case 'enterRenaming':
          this.handleEnterRenaming()
          break;
        case 'deleteItems':
          this.handleDeleteItemsAction()
          break;
        default:
          break;
      }
    },
    handleLoadmoreAction () {
    },
    handleEnterRenaming () {
      const indexs = ResourceHandler.getSelectItemIndexs(this.dataArray)
      if (indexs.length === 1) {
        const item = this.dataArray[indexs[0]]
        item.renaming = item.renaming === true ? false : true
        this.dataArray.splice(indexs[0], 1, item)
      }
    },
    handleDeleteItemsAction () {
      let canDelete = true
      for (let index = 0; index < this.dataArray.length; index++) {
        const element = this.dataArray[index]
        if (element.renaming === true || element.disable === true) {
          canDelete = false
          break 
        }
      }
      if (!canDelete) return
      this.handleDeletAction()
    },
    handleItemActions (action: string, index: number, ...args: any[]) {
      switch (action) {
        case 'renameRequest':
          this.handleRenameRequestAction(index, args[0])
          break;
        case 'newFolderRequest':
          this.handleNewFolderRequestAction(index, args[0])
          break;
        default:
          break;
      }
    },
    handleRenameRequestAction (index: number, newName: string) {
      // TODO: 当前没有对文件名合法性进行校验
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
    handleNewFolderRequestAction (index: number, newName: string) {
    },
    // handle main view context menu actions
    handleContextMenuActions (command: string, ...args: any[]) {
      switch (command) {
        case 'open': 
          this.handleOpenAction(args[0])
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
        case 'moveto':
          this.handleMoveToAction()
          break;
        case 'delete':
          this.handleDeletAction()
          break;
        case 'rename':
          this.handleRenameAction()
          break;
        case 'encrypt':
          this.handleEncryptAction()
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
        default:
          break;
      }
    },
    handleOpenAction (item?: ResourceItem) {
      let srcItem = item
      if (srcItem === undefined) {
        const selectedItem = ResourceHandler.getFirstSelectItem(this.dataArray)
        if (selectedItem !== null) srcItem = selectedItem
      }
      if (srcItem === undefined) return
      srcItem.type === ResourceType.folder ? this.handleOpenFolderAction(srcItem) : this.handleOpenFileAction(srcItem)
    },
    handleOpenFolderAction (item: ResourceItem) {
      this.$router.push({
        name: 'main-resource-view',
        query: {
          path: item.path,
          uuid: item.uuid
        },
        params: {
          showPath: `${this.currentPath}/${item.name}`
        }
      })
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
    handleJumpAction () {
      const item = ResourceHandler.getFirstSelectItem(this.dataArray)
      EventBus.$emit(EventName.jump, item)
    },
    handleDownloadAction (directory: string[]) {
      const myThis = this as any
      const items = ResourceHandler.getSelectItems(this.dataArray)
      items.forEach(item => {
        if (item.path.indexOf('.ugreen_nas') === -1) {
          myThis.$electron.remote.getCurrentWindow().webContents.downloadURL(NasFileAPI.httpEncryptDownload(item))
        } else {
          myThis.$electron.remote.getCurrentWindow().webContents.downloadURL(NasFileAPI.download(item))
        }
      });
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
    handleMoveToAction () {
      // TODO: 移动文件位置
    },
    handleDeletAction () {
      const items = ResourceHandler.getSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      this.showDeleteDialog(items).then(result => {
        if (result === 1) return // filter cancel action
        this.handleDeletRequest(items)
      })
    },
    handleDeletRequest (items: ResourceItem[]) {
      ResourceHandler.disableSelectItems(this.dataArray)
      NasFileAPI.addDeleteTask(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
        this.$message.info('任务添加成功')
        this.$store.dispatch('Resource/increaseTask')
      }).catch(_ => {
        this.$message.error('删除失败')
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
      })
    },
    showDeleteDialog (items: ResourceItem[]): Promise<number> {
      return new Promise((resolve, reject) => {
        const { dialog } = require('electron').remote
        const message = items.length > 1 ? `你确定要删除所选的${items.length}个项目吗？` : `你确定要删除”${items[0].name}“吗？`
        setTimeout(() => {
          dialog.showMessageBox({
            type: 'info',
            message,
            buttons: ['删除', '取消'],
            cancelId: 1
          }).then(result => {
            resolve(result.response)
          }).catch(error => {
            reject(error)
          })
        }, 100);
      })
    },
    handleRenameAction () {
      const index = ResourceHandler.getFirstSelectItemIndex(this.dataArray)
      const item = this.dataArray[index]
      item.renaming = true
      this.dataArray.splice(index, 1, item)
    },
    handleEncryptAction () {
      // TODO: 文件加密
    },
    handleInfoAction () {
      const _this = this as any
      const items = ResourceHandler.getSelectItems(this.dataArray)
      if (_.isEmpty(items) || items.length > 1) return
      const item = items[0]
      _this.$ipc.send('file-control', 0, item);
      // processCenter.renderSend(EventName.mediaInfo, {
      //   path: 'media-info',
      //   params: {
      //     uuid: item.uuid,
      //     path: item.path
      //   }
      // })
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
    handleModifyPassAction () {
    },
    handleResetAction () {
    },
    handleMoveoutAction () {
    },
    handleModifyAction () {
    }
  }
})
