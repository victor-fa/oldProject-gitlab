// main view mixins，主要处理mainview中可能会被重写的事件
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import ResourceHandler from './ResourceHandler'
import { ResourceItem, OrderType, ResourceType, ShareStatus, CollectStatus } from '@/api/NasFileModel'
import NasFileAPI, { TaskMode } from '@/api/NasFileAPI'
import processCenter, { EventName } from '@/utils/processCenter'

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
    ...mapGetters('Resource', ['clipboard'])
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
        default:
          break;
      }
    },
    handleLoadmoreAction () {
    },
    handleItemActions (action: string, index: number, ...args: any[]) {
      switch (action) {
        case 'rename':
          this.handleRenameRequestAction(index, args[0])
          break;
        default:
          break;
      }
    },
    handleRenameRequestAction (index: number, newPath: string) {
      const item = ResourceHandler.disableFirstSelectItem(this.dataArray)
      if (item === undefined) return
      NasFileAPI.renameResource(item.path, newPath, item.uuid).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('重命名成功')
        item.renaming = false
        this.dataArray.splice(index, 1, item)
      }).catch(error => {
        console.log(error)
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('重命名失败')
      })
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
      // TODO: 跳到文件指定位置
    },
    handleDownloadAction (directory: string[]) {
      console.log(directory)
      const myThis = this as any
      const items = ResourceHandler.getSelectItems(this.dataArray)
      items.forEach(item => {
        myThis.$electron.remote.getCurrentWindow().webContents.downloadURL(NasFileAPI.download(item));
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
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      NasFileAPI.addDeleteTask(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
      }).catch(error => {
        console.log(error)
        this.$message.error('删除失败')
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
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
      if (_.isEmpty(items)) return
      if (items.length > 1) return
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
    handleUploadAction (filePaths: string[]) {
    },
    handleNewFolderAction () {
    },
    handlePasteAction (mode: TaskMode) {
    }
  }
})
