<template>
  <div class="main-view">
    <main-header-view
      :directory="currentPath"
      :popoverList="sortList"
      v-on:CallbackAction="handleHeaderViewAction"
    />
    <a-spin :spinning="loading">
      <resource-list
        ref="resourceList"
        :dataSource="showArray"
        :busy="busy"
        :arrangeWay="arrangeWay"
        :disableContextMenu="disableAlter"
        v-on:CallbackAction="handleResourceListAction"
      />
    </a-spin>
    <input type="file" id="FileArea" @change="PrepareUploadFile" hidden ref="FileArea" multiple="multiple" />
    <!-- 上传所选文件 -->
    <input ref="FileArea" type="file" multiple directory @change="PrepareUploadFile" mozdirectory hidden />
    <!-- 上传所选文件夹 -->
    <input ref="FolderArea" type="file" multiple @change="PrepareUploadFile" webkitdirectory hidden>
    <main-bottom-view :itemCount="itemCount"/>
    <operate-list-alter
      v-show="showAlter"
      ref="operateListAlter"
      :operateList="showOperateList"
      :style="alterStyle"
      v-on:didSelectItem="handleAlterAction"
    />
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainHeaderView, { MainHeaderAction } from './MainHeaderView.vue'
import MainBottomView from './MainBottomView.vue'
import ResourceList, { ResourceListAction } from '../../components/ResourceList/index.vue'
import { ResourceItem, ArrangeWay, OrderType, CollectStatus, ShareStatus, ResourceType } from '../../api/NasFileModel'
import processCenter, { EventName } from '../../utils/processCenter'
import ResourceHandler from './ResourceHandler'
import { CategoryType } from '../../model/categoryList'
import OperateListAlter from '../../components/OperateListAlter/index.vue'
import NasFileAPI, { TaskMode } from '../../api/NasFileAPI'
import { BasicResponse, User } from '../../api/UserModel'
import { OperateGroup } from '../../components/OperateListAlter/operateList'
import { sortList } from '../../model/sortList'
import { EventBus, EventType } from '../../utils/eventBus'
import { TRANSFORM_INFO } from '../../common/constants'
import upload from '../../utils/file/upload'

export default Vue.extend({
  name: 'main-view',
  components: {
    MainHeaderView,
    MainBottomView,
    ResourceList,
    OperateListAlter
  },
  data () {
    let items: Array<ResourceItem> = []
    let list: Array<OperateGroup> = []
    return {
      loading: false,
      dataArray: items, // 当前页的全部数据
      showArray: items, // 当前页展示的数据
      currentPath: '', // 当前页的路径
      busy: false, // 控制是否响应加载更多方法
      arrangeWay: ArrangeWay.horizontal, // list的排序方式
      alterPosition: { left: '0px', top: '0px' }, // 右键菜单样式
      showAlter: false, // 控制右键菜单的显示与隐藏
      disableAlter: false, // 是否禁用右键菜单
      showOperateList: list, // 展示的右键菜单选项集合
      handleItem: false, // 在处理item(如：收藏、分享)过程中，item将设置为disable状态
      sortList: sortList, // MianHeaderView中排序弹窗列表的数据源
      transformData: []
    }
  },
  watch: {
    dataArray: function (newValue) {
      this.showArray = newValue
    },
		transformData: {
			handler() {
				const myThis = this as any
				myThis.$nextTick(() => {
					myThis.transformData.forEach((item, index) => {
						item.shows = myThis.loadClassify === item.state || (item.trans_type === myThis.loadClassify && item.state !== 'completed');
					});
				});
				localStorage.setItem(TRANSFORM_INFO, JSON.stringify(myThis.transformData))
			},
			deep: true
		}
  },
  computed: {
    alterStyle: function (): object {
      return {
        left: this.alterPosition.left,
        top: this.alterPosition.top
      }
    },
    itemCount: function () {
      const myThis: any = this
      return myThis.showArray.length
    },
    ...mapGetters('Resource', ['clipboard'])
  },
	created() {
    this.Bind();
	},
  mounted () {
    this.getTransformInfo()
  },
  methods: {
    // handle component callback action
    handleHeaderViewAction (actionType: MainHeaderAction, ...args: any[]) {
      switch (actionType) {
        case MainHeaderAction.tabChange:
          this.handleTabChange(args[0])
          break;
        case MainHeaderAction.back:
          this.overrideBackAction()
          break;
        case MainHeaderAction.search:
          this.overrideSearchAction(args[0])
          break;
        case MainHeaderAction.endSearch:
          this.handleEndSerchAction()
          break;
        case MainHeaderAction.refresh:
          this.overrideRefreshAction()
          break;
        case MainHeaderAction.sortWayChange:
          this.overrideSortWayChangeAction(args[0])
          break;
        case MainHeaderAction.arrangeChange:
          this.handleArrangeChange(args[0])
          break;
      }
    },
    handleResourceListAction (actionType: ResourceListAction, ...args: any[]) {
      switch (actionType) {
        case ResourceListAction.loadMoreData:
          this.overrideloadMoreData()
          break;
        case ResourceListAction.openItem:
          this.handleOpenAction()
          break;
        case ResourceListAction.contextMenu:
          this.handleContextMenuAction(args[0], args[1])
          break;
        case ResourceListAction.listContextMenu:
          this.handleListContextMenuAction(args[0])
          break;
        case ResourceListAction.singleSelectItem:
          this.handleSingleAction(args[0])
          break;
        case ResourceListAction.multipleSelectItem:
          this.handleMultipleAction(args[0])
          break;
        case ResourceListAction.listMultipleSelectItem:
          this.handleListMultipleAction(args[0])
          break;
        case ResourceListAction.listClick:
          this.handleListClickAction()
          break;
      }
    },
    handleAlterAction (command: string, ...args: any[]) {
      this.showAlter = false
      const myThis = this as any
      switch (command) {
        case 'open': 
          this.handleOpenAction()
          break;
        case 'jump':
          this.handleJumpAction()
          break;
        case 'download':
          this.getTransformInfo()
          this.handleDownloadAction()
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
          this.$message.info('文件已复制到剪切板')
          this.handleClipboardAction(false)
          break;
        case 'cut':
          this.$message.info('文件已剪切到剪切板')
          this.handleClipboardAction()
          break;
        case 'moveto':
          
          break;
        case 'delete':
          this.handleDeletAction()
          break;
        case 'rename':
          this.handleRenameAction()
          break;
        case 'encrypt':
          
          break;
        case 'info':
          this.handleInfoAction()
          break;
        case 'uploadFile':
          myThis.getTransformInfo()
          myThis.$refs.FileArea.value = '';
          myThis.$refs.FileArea.click();
          break;
        case 'uploadFolder':
          myThis.getTransformInfo()
          myThis.$refs.FolderArea.value = '';
          myThis.$refs.FolderArea.click();
          break;
        case 'newFolder':
          
          break;
        case 'clearClipboard':
          this.clearClipboardAction()
          break;
        case 'paste':
          const mode = ResourceHandler.matchTaskMode(args[0])
          this.overridePasteAction(mode)
          break;
        case 'refresh':
          this.overrideRefreshAction()
          break;
      }
    },
    // handle main header view compoennt action methods
    handleTabChange (categoryType: CategoryType) {
      this.showArray = ResourceHandler.classifyArray(this.dataArray, categoryType)
    },
    handleEndSerchAction () {
      this.showArray = this.dataArray
    },
    handleArrangeChange (arrangeWay: ArrangeWay) {
      this.arrangeWay = arrangeWay
    },
    // handle resource list action methods
    handleOpenAction () {
      const item = ResourceHandler.getFirstSelectItem(this.showArray)
      if (item === null) return
      item.type === ResourceType.folder ? this.overrideOpenFolderAction(item) : this.handleOpenFileAction(item)
    },
    handleOpenFileAction (item: ResourceItem) {
      const myThis: any = this
      let OpenType = item.type;
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
      // TODO: 调到文件指定位置
    },
    handleContextMenuAction (event: MouseEvent, index: number) {
      this.showArray = ResourceHandler.setSingleSelectState(this.showArray, index, true)
      const list = ResourceHandler.filterItemOperateList(this.showArray)
      this.showContextMenu(list, event)
    },
    handleListContextMenuAction (event: MouseEvent) {
      const list = ResourceHandler.filterOperateList(this.clipboard)
      this.showContextMenu(list, event)
    },
    showContextMenu (list: Array<OperateGroup>, event: MouseEvent) {
      this.showOperateList = list
      this.showAlter = true
      this.$nextTick(() => {
        const alter = this.$refs.operateListAlter as Vue
        this.alterPosition = ResourceHandler.calculateSafePositionOnWindow(event.clientX, event.clientY, alter)
      })
    },
    handleSingleAction (index: number) {
      this.showAlter = false
      this.showArray = ResourceHandler.setSingleSelectState(this.showArray, index, true)
    },
    handleMultipleAction (index: number) {
      this.showArray = ResourceHandler.setSelectState(this.showArray, index, true)
    },
    handleListMultipleAction (index: number) {
      this.showArray = ResourceHandler.shiftMultipleSelect(this.showArray, index)
    },
    handleListClickAction () {
      if (this.showAlter) {
        this.showAlter = false
      } else {
        if (this.handleItem) return
        this.showArray = ResourceHandler.resetSelectState(this.showArray)
      }
    },
    getTransformInfo () {
			const myThis = this as any
      const temp:any = localStorage.getItem(TRANSFORM_INFO)
      let tempJson = JSON.parse(temp)
      myThis.transformData = tempJson !== null ? tempJson : []
      console.log(myThis.transformData);
    },
		Bind: function() {
			const myThis = this as any
			myThis.$ipc.on('download', (e, file, completed) => {
        completed && myThis.$ipc.send('system', 'popup', file.name + '下载完成');
        localStorage.setItem(TRANSFORM_INFO, JSON.stringify(myThis.transformData))
				for (let i = 0; i < myThis.transformData.length; i++) {
					if (file.name === myThis.transformData[i].name) {
						myThis.$nextTick(() => {
							for (let name in myThis.transformData[i]) {
								myThis.transformData[i][name] = file[name];
							}
						});
						return;
					}
        }
				myThis.$nextTick(() => {
					myThis.transformData.push(file);
				});
			});
		},
    // handle operate list component action methods
    handleDownloadAction () {
      const myThis = this as any
      const items = ResourceHandler.getSelectItems(this.showArray)
      items.forEach(item => {
        myThis.$electron.remote.getCurrentWindow().webContents.downloadURL(NasFileAPI.download(item));
      });
    },
		PrepareUploadFile(data: any) {
      const myThis = this as any
      console.log(data.target);
			upload.prepareFile(data.target, {
				// data: myThis.NowDiskID,
				add: file => {
					console.log(file);
					myThis.transformData.push(file);
					myThis.$message.info((data.target ? data.target : data).files.length + '个文件已加入上传列队');
				},
				success: (file, response) => {
					console.log(response);
					// const _this = myThis as any
					const rs = response.data;
					if (rs.code !== 200) {
						if (rs.code === '4050') {
							myThis.$message.warning('文件已存在')
						} else {
							myThis.$message.warning(rs.msg)
						}
						return
					}
          localStorage.setItem(TRANSFORM_INFO, JSON.stringify(myThis.transformData))
          // 刷新
          myThis.handleRefreshAction()
					myThis.$message.success('文件上传成功！')
          myThis.$ipc.send('system', 'popup', file.name + '上传完成');
				}
			});
		},
    handleShareAction () {
      this.handleItem = true
      const items = ResourceHandler.disableSelectItems(this.showArray)
      NasFileAPI.shareResource(items).then(response => {
        this.handleItem = false
        if (response.data.code !== 200) return
        this.$message.info('分享成功')
        this.showArray = ResourceHandler.resetShareState(this.showArray)
      }).catch(error => {
        this.handleItemError(error)
      })
    },
    handleUnshareAction () {
      this.handleItem = true
      const items = ResourceHandler.disableSelectItems(this.showArray)
      NasFileAPI.cancelShare(items).then(response => {
        this.handleItem = false
        if (response.data.code !== 200) return
        this.$message.info('取消分享')
        this.showArray = ResourceHandler.resetShareState(this.showArray, ShareStatus.not)
      }).catch(error => {
        this.handleItemError(error)
      })
    },
    handleCollection () {
      this.handleItem = true
      const items = ResourceHandler.disableSelectItems(this.showArray)
      NasFileAPI.collectFile(items).then(response => {
        this.handleItem = false
        if (response.data.code !== 200) return
        this.$message.info('收藏成功')
        this.showArray = ResourceHandler.resetCollectState(this.showArray)
      }).catch(error => {
        this.handleItemError(error)
      })
    },
    handleUnCollectAction () {
      this.handleItem = true
      const items = ResourceHandler.disableSelectItems(this.showArray)
      NasFileAPI.cancelCollect(items).then(response => {
        this.handleItem = false
        if (response.data.code !== 200) return
        this.$message.info('取消成功')
        this.showArray = ResourceHandler.resetCollectState(this.showArray, CollectStatus.not)
      }).catch(error => {
        this.handleItemError(error)
      })
    },
    handleItemError (error: any) {
      console.log(error)
      this.handleItem = false
      this.$message.error('网络连接错误，请检测网络')
      this.showArray = ResourceHandler.resetDisableState(this.showArray)
    },
    handleClipboardAction (isClip: boolean = true) {
      const items = ResourceHandler.getSelectItems(this.showArray)
      this.$store.dispatch('Resource/updateClipboard', { isClip: isClip, items })
    },
    handleDeletAction () {
      const items = ResourceHandler.getSelectItems(this.showArray)
      if (_.isEmpty(items)) return
      console.log(items)
      // TODO: 删除文件
    },
    handleRenameAction () {
      const items = ResourceHandler.getSelectItems(this.showArray)
      if (_.isEmpty(items)) return
      if (items.length > 1) return
      const item = items[0]
      const list: any = this.$refs.resourceList
      list.handleRenameAction(item)
    },
    handleInfoAction () {
      const items = ResourceHandler.getSelectItems(this.showArray)
      if (_.isEmpty(items)) return
      if (items.length > 1) return
      const item = items[0]
      processCenter.renderSend(EventName.mediaInfo, {
        path: 'media-info',
        params: {
          uuid: item.uuid,
          path: item.path
        }
      })
    },
    clearClipboardAction () {
      this.$store.dispatch('Resource/updateClipboard', { isClip: false, items: [] })
      this.$message.info('剪切板已清空')
    },
    // subclass implementation methods
    overrideloadMoreData () {
    },
    overrideRefreshAction () {
    },
    overrideBackAction () {
      this.$router.go(-1)
    },
    overrideOpenFolderAction (item: ResourceItem) {
    },
    overrideSortWayChangeAction (order: OrderType) {
      this.showArray = ResourceHandler.orderShowArray(this.showArray, order)
    },
    overrideSearchAction (keyword: string) {
      this.showArray = ResourceHandler.searchShowArray(this.showArray, keyword)
    },
    overridePasteAction (mode: TaskMode) {
    }
  }
})
</script>
