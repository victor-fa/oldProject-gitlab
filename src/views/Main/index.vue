<template>
	<div>
    <resource-header v-if="isShowHeader"/>
    <div class="cd-upload-tips" v-show="ShowUploadTips && DiskData.Type === 'disk' && loadClassify === 'normal'">松开鼠标开始上传文件</div>
    <section
      class="cd-bottom"
      @mousedown="MainMouseFunc"
      @dragover.prevent.stop="ShowUploadTips = true"
      @dragleave.prevent.stop="ShowUploadTips = false"
      ref="CloudDiskMain"
			:style="{ height: AutoHeight }"
    >
      <div
        class="resource-list"
        v-bind:class="{ horizontalResourceList: !isShowHeader }"
        :style="{ height: scrollHeight + 'px' }"
        v-infinite-scroll="handleInfiniteOnLoad"
        :infinite-scroll-disabled="busy"
        :infinite-scroll-distance="10"
        @dragover.prevent.stop="ShowUploadTips = true"
        @dragleave.prevent.stop="ShowUploadTips = false"
        @drop.prevent.stop="UploadDrop"
      >
      
          <!-- <loading :loading="IsLoadCompany" :length="UserDiskData.length" :IsNoDiskData="IsNoDiskData" /> -->
          <div class="cd-mouse-select" v-show="MouseSelectData.width" :style="MouseSelectData" />
          <!-- <DiskTransList v-show="DiskData.Type === 'trans'" :data="TransformData" @ControlTrans="ControlTrans" /> -->

          <DiskFile @SelectFiles="SelectFiles" @OpenFile="DiskFeatureControl" v-if="LoadCompany && NoTransType" :data="UserDiskData" :DiskData="DiskData" />
          <!-- <a-list
            :dataSource="UserDiskData"
            :grid="grid"
          >
            <a-list-item
              slot="renderItem"
              slot-scope="item, index"
              @dblclick="didSelectItem(item)"
              @contextmenu.prevent="didOperatItem($event, item)"
            >
              <resource-list-item :model="item" :index="index" :arrangeWay="arrangeWay"/>
            </a-list-item>
            <div v-if="loading && !busy" class="demo-loading-container">
              <a-spin />
            </div>
          </a-list> -->
          
      </div>
    </section>
		<input type="file" id="FileArea" @change="PrepareUploadFile" hidden ref="FileArea" multiple="multiple" />
    <MouseMenu :type="loadClassify" :node="$refs.CloudDiskMain" :DiskData="DiskData" @callback="DiskFeatureControl" ref="MouseMenu" />
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import infiniteScroll from 'vue-infinite-scroll'
import { EventBus, EventType } from '../../utils/eventBus'
import processCenter, { EventName } from '../../utils/processCenter'
import { ArrangeWay, ResourceItem } from '../../components/ResourceList/ResourceModel'
import { CategoryType } from '../../components/BasicHeader/Model/categoryList'
import DiskFile from '../../components/Disk/DiskFile.vue'
import MouseMenu from '../../components/Disk/MouseMenu.vue'
// import ResourceListItem from '../../components/ResourceList/ResourceListItem.vue'
import ResourceHeader from '../../components/ResourceList/ResourceHeader.vue'
import upload from '../../utils/file/upload';
import NasFileAPI from '../../api/NasFileAPI'

export default {
  name: 'main',
  directives: { infiniteScroll },
  components: {
    // ResourceListItem,
    ResourceHeader,
    DiskFile,
    MouseMenu
  },
  props: {
    dataSource: Array
  },
  data () {
    return {
			DiskData: {
				ClipboardType: false, //剪切板是复制还是剪切
				Clipboard: [], //剪切板的文件
				SelectFiles: [], //选择的文件
				NavData: [], //记录导航栏数据
				KeyFlag: false, //全局键盘记录
				NowSelect: {}, //记录一个选择的文件
				DiskShowState: 'cd-disk-block-file', //文件显示类型，默认图标,
				SelectTips: '0个项目', //选择文件提示
				Type: 'disk', //头部分类标签,
				ClassifyName: '网盘', //地址栏左侧分类显示文本,
				DiskSize: {
					/*网盘大小*/
					total: 0,
					use: 0,
					Percent: '0%',
					Background: '#2682fc',
					text: '0B/0B'
				}
			},
			/*上传提示*/
      loading: false,
			DiskLoadCount: 0,
      busy: false,
      scrollHeight: 450,
      arrangeWay: ArrangeWay.horizontal,
      currentArray: [],
      directoryList: [],
      alterPosition: { left: '0px', top: '0px' },
			NowDiskID: null,
			UserDiskData: [], //存放用户网盘数据
			loadClassify: 'normal', //网盘加载的分类
			LoadCompany: false, //是否加载完成
			DiskPage: 1, //网盘加载的页数
			/*拖拽选择参数*/
			MouseSelectData: {
				left: 0,
				top: 0,
				width: 0,
				height: 0
			},
			/*上传提示*/
			ShowUploadTips: false,
			/*文件传输列表参数*/
			SelectDownLoadFiles: [], //选择下载的文件
    }
  },
  watch: {
    dataSource() {
      const myThis = this as any
      myThis.currentArray = myThis.dataSource
    },
		loadClassify: {
			handler() {
        const myThis = this as any
				if (myThis.DiskData.Type === 'trans') {
					myThis.$nextTick(() => {
						myThis.TransformData.forEach(item => {
							item.shows = myThis.loadClassify === item.state || (item.trans_type === myThis.loadClassify && item.state !== 'completed');
						});
					});
				}
			},
			deep: true
		},
		UserDiskData: {
			handler() {
        const myThis = this as any
				myThis.NeedHide = true;
				myThis.DiskData.SelectFiles = [];
				myThis.UserDiskData.forEach((item, index) => {
					if (item.active) {
						item.index = index;
						myThis.DiskData.SelectFiles.push(item);
					}
				});
				if (myThis.DiskData.SelectFiles.length) {
					myThis.DiskData.SelectTips = '选中' + myThis.DiskData.SelectFiles.length + '个项目';
				} else {
					myThis.DiskData.SelectTips = myThis.UserDiskData.length + '个项目';
				}
				// console.log(JSON.parse(JSON.stringify(myThis.UserDiskData.SelectFiles)));
				// console.log(JSON.parse(JSON.stringify(myThis.UserDiskData)));
			},
			deep: true
		},
  },
  computed: {
    grid: function () {
      const myThis = this as any
      if (myThis.arrangeWay === ArrangeWay.horizontal) {
        return { gutter: 16, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, xxl: 24 }
      }
      return { gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }
    },
    isShowHeader: function () {
      const myThis = this as any
      if (myThis.arrangeWay === ArrangeWay.vertical) {
        return true
      }
      return false
    },
    alterStyle: function (): object {
      const myThis = this as any
      return {
        left: myThis.alterPosition.left,
        top: myThis.alterPosition.top
      }
    },
    NoTransType: function () {
      const myThis = this as any
			return myThis.DiskData.Type !== 'trans';
    },
		AutoHeight() {
      const myThis = this as any
			return (
				'calc(100% - 120px - ' +
				(myThis.isTrash ? '32ppx' : '0') +
				(myThis.DiskData.DiskShowState !== 'cd-disk-block-file' && myThis.NoTransType ? '32px' : '0px') +
				')'
			);
		}
  },
  mounted () {
    const myThis = this as any
    window.addEventListener('resize', myThis.observerWindowResize)
    myThis.observerEventBus()
    myThis.observerWindowResize()
    myThis.getDeviceInfo()
  },
  destroyed () {
    const myThis = this as any
    window.removeEventListener('resize', myThis.observerWindowResize)
    EventBus.$off(EventType.backAction)
    EventBus.$off(EventType.categoryChangeAction)
    EventBus.$off(EventType.arrangeChangeAction)
  },
	created() {
    const myThis = this as any
		myThis.Bind();
	},
  methods: {
		/*初始化*/
		Bind: function() {
			window.addEventListener(
				'dragenter',
				function(e) {
					e.preventDefault();
				},
				false
			);
			window.addEventListener(
				'dragover',
				function(e) {
					e.preventDefault();
				},
				false
			);
			window.addEventListener(
				'dragleave',
				function(e) {
					e.preventDefault();
				},
				false
			);
			window.addEventListener(
				'drop',
				function(e) {
					e.preventDefault();
				},
				false
			);
		},
    observerWindowResize () {
      const myThis = this as any
      const newHeight = document.body.clientHeight - 128
      if (newHeight !== myThis.scrollHeight) {
        myThis.scrollHeight = newHeight
      }
    },
    observerEventBus () {
      const myThis = this as any
      EventBus.$on(EventType.backAction, () => {
        // TODO: 在有多级目录时，这里应该设置一个数据栈
        myThis.currentArray = myThis.dataSource
        myThis.directoryList = myThis.currentArray
        myThis.$store.dispatch('Resource/popPath')
      })
      EventBus.$on(EventType.categoryChangeAction, (type: CategoryType) => {
        myThis.currentArray = myThis.filterCurrentArray(type)
      })
      EventBus.$on(EventType.arrangeChangeAction, (way: ArrangeWay) => {
        myThis.arrangeWay = way
      })
    },
    filterCurrentArray (type: CategoryType) {
      const myThis = this as any
      let newArray:any = []
      for (let index = 0; index < myThis.directoryList.length; index++) {
        const element = myThis.directoryList[index]
        if (myThis.isInclude(type, element.type)) {
          newArray.push(element)
        }
      }
      return newArray
    },
    isInclude (ctype: CategoryType, rtype) {
      console.log('isInclude');
      const myThis = this as any
      switch (ctype) {
        case CategoryType.all:
          return true
        case CategoryType.image:
          if (rtype === 3) {
            return true
          }
          break
        case CategoryType.video:
          if (rtype === 1) {
            return true
          }
          break
        case CategoryType.audio:
          if (rtype === 2) {
            return true
          }
          break
        case CategoryType.document:
          if (rtype !== 3 && rtype !== 1 && rtype !== 2 && rtype !== 6) {
            return true
          }
          break
      }
      return false
    },
    handleInfiniteOnLoad () {
      const myThis = this as any
      console.log('load more data')
      // EventBus.$emit(EventType.categoryChangeAction, item.type)
    },
    didSelectItem (item: ResourceItem) {
			console.log(JSON.parse(JSON.stringify(item)));
      const myThis = this as any
      switch (item.type) {
        case 6:
          myThis.openFolder(item)
          break
        default:
          break
      }
    },
    openFolder (item) {
      const myThis = this as any
      // reload data
      myThis.currentArray = item.subResources !== undefined ? item.subResources : []
      myThis.directoryList = myThis.currentArray
      // change path
      myThis.$store.dispatch('Resource/pushPath', item.name)
    },
    didOperatItem (event: MouseEvent, item: ResourceItem) {
      const myThis = this as any
      // event.preventDefault()
      // const alter: any = myThis.$refs.operateListAlter
      // alter.showAlter()
      myThis.alterPosition = myThis.calculateSafePosition(event.clientX, event.clientY)
    },
    calculateSafePosition (clientX: number, clientY: number) {
      const width = document.body.clientWidth
      const height = document.body.clientHeight
      const paddingRight = 10; const paddingBottom = 17
      const alterWidth = 100 + paddingRight
      const alterHeight = 189 + paddingBottom
      let left = clientX + alterWidth < width ? clientX : width - alterWidth
      let top = clientY + alterHeight < height ? clientY : height - alterHeight
      return { left: left + 'px', top: top + 'px' }
    },
    UploadDrop (e: any) { //拖拽上传
      const myThis = this as any
			if (myThis.loadClassify === 'normal') {
				myThis.PrepareUploadFile(e.dataTransfer);
				myThis.ShowUploadTips = false;
			}
		},
		PrepareUploadFile(data: any) {
			const myThis = this as any
			const selectUploadFiles:any = [];
			if (data.target) {
				data = data.target;
			}
			for (let k = 0; k < data.files.length; k++) {
				selectUploadFiles.push(data.files[k]);
			}
			let params = {
				uuid: 'A252FB4252FB19AD',
				path: '/.ugreen_nas/6001/' + data.files[0].name,	// 当前目录
				start: 0,
				end: data.files[0].size-1,
				size: data.files[0].size,
				action: 'f'
			}
			let body = selectUploadFiles[0];
			NasFileAPI.upload({
				data: params,
				body: body
			}).then(response => {
				const rs = response.data;
				if (rs.code !== 200) {
					if (rs.code === '4050') {
						myThis.$message.warning('文件已存在')
					} else {
						myThis.$message.warning(rs.msg)
					}
					return
				}
				myThis.UserDiskData.push(rs.data);
				myThis.getDeviceInfo()
				myThis.$message.success('文件上传成功！')
			})
		},
    alterBlur (el: any) {
      console.log('alter blur')
      console.log(el)
    },
    // 获取到菜单返回的结果
    DiskFeatureControl (commend: any, datas: any, flag) {
      const myThis = this as any
			let data = null;
			console.log(commend);
			if (commend === 'Copy' || commend === 'Cut') {
				myThis.DiskFeatureControl('clear');
				if (myThis.DiskData.SelectFiles.length) {
					myThis.DiskData.Clipboard = myThis.DiskData.SelectFiles;
				} else if (myThis.DiskData.NowSelect.disk_id) {
					myThis.DiskData.Clipboard.push(myThis.DiskData.NowSelect);
				}
				let tips = myThis.DiskData.Clipboard.length > 1 ? '所选' + myThis.DiskData.Clipboard.length + '个项目' : myThis.DiskData.NowSelect.path;
				switch (commend) {
					case 'Copy':
						tips = tips + '已复制到剪贴板';
						break;
					case 'Cut':
						tips = tips + '已剪切到剪贴板';
						break;
				}
				myThis.$message.info(tips);
				return (myThis.DiskData.ClipboardType = commend);
			}
			commend = commend ? commend : 'newFolder';
			switch (commend) {
				case 'open' /*打开文件夹/文件*/:
					let item = datas;
					if (!item) {
						item = myThis.DiskData.NowSelect;
					}
					if (!item.disk_main) {
						myThis.DiskData.NavData.push(item);
						myThis.ClearSelect();
						myThis.GetMainFile(item.disk_id, 'normal');
					} else {
						let OpenType = myThis.DiskData.NowSelect.OpenType;
						if (OpenType === 'zip') {
							myThis.showTree = true;
							myThis.ShowUnZip = true;
						} else if (OpenType !== null) {
							let data:any = [];
							if (OpenType === 'image' || OpenType === 'video' || OpenType === 'audio') {
								myThis.UserDiskData.forEach(file => {
									if (file.type.Exist(item.TypeArray)) {
										data.push(file);
									}
								});
							}
							myThis.$ipc.send('file-control', OpenType, data.length ? data : myThis.DiskData.NowSelect);
						} else {
							myThis.$message.warning('暂不支持打开该类型文件');
						}
					}
					break;
				case 'upload': //上传文件
					myThis.$refs.FileArea.value = '';
					myThis.$refs.FileArea.click();
					if (datas) {
						myThis.PrepareUploadFile(datas.dataTransfer);
						myThis.ShowUploadTips = false;
					}
					break;
				case 'download': //下载文件
					console.log(JSON.parse(JSON.stringify(myThis.DiskData)));
					if (myThis.DiskData.SelectFiles.length) {
						myThis.DiskData.SelectFiles.forEach(item => {
							if (item.disk_main) {
								myThis.SelectDownLoadFiles.push(item);
							}
						});
					} else {
						if (myThis.DiskData.NowSelect) {
							myThis.SelectDownLoadFiles.push(myThis.DiskData.NowSelect);
						}
					}
					console.log(JSON.parse(JSON.stringify(myThis.SelectDownLoadFiles)));
					let tips = myThis.SelectDownLoadFiles.length > 1 ? '所选' + myThis.SelectDownLoadFiles.length + '个项目' : myThis.SelectDownLoadFiles[0].path;
					const { BrowserWindow } = require('electron').remote
					myThis.SelectDownLoadFiles.forEach(item => {
						BrowserWindow.getAllWindows()[0].webContents.downloadURL(NasFileAPI.download(item));	// 下载
					});
					myThis.SelectDownLoadFiles = [];
					myThis.$message.info(tips + '已加入下载列队');
          break
				case 'search': //搜索
					if (flag) {
						myThis.DiskPage = 1;
						myThis.UserDiskData = [];
						myThis.DiskData.ClassifyName = '搜索';
						myThis.NavigationControl('clear');
					}
					myThis.$Api.Disk.Search(
						{
							id: datas,
							page: myThis.DiskPage
						},
						rs => {
							myThis.DiskBatchData('print', rs);
						}
					);
					break;
				case 'sort': //网盘排序方法
					if (typeof datas === 'object') {
						myThis.UserDiskData = datas;
					} else {
						myThis.$refs.DiskSortBar.DiskSort(datas, flag);
					}
					break;
				case 'state': //切换文件显示模式
					myThis.DiskData.DiskShowState = datas;
					break;
				case 'newFolder':
					console.log('新建文件夹未开始');
					// myThis.InputConfrim({
					// 	title: '新建文件夹',
					// 	tips: '请输入文件夹名称',
					// 	callback: value => {
					// 		if (value.length === 0) {
					// 			return myThis.$message.error('文件夹名称不能为空');
					// 		}
					// 		myThis.$Api.Disk.NewFolder(
					// 			{
					// 				name: value,
					// 				parent_id: myThis.NowDiskID
					// 			},
					// 			rs => {
					// 				rs = rs[0];
					// 				if (rs.disk_id) {
					// 					myThis.UserDiskData.push(rs);
					// 					myThis.$message.success(value + ' 已创建');
					// 				} else {
					// 					myThis.$message.error(value + ' 已存在');
					// 				}
					// 			}
					// 		);
					// 	}
					// });
					break;
				case 'clear':
					myThis.DiskData.Clipboard = [];
					break;
				case 'MoveTo':
					myThis.ShowUnZip = false;
					myThis.showTree = true;
					break;
				case 'paste': //粘贴
					let CutFlag = true;
					let CopySize = 0;
					if (myThis.DiskData.Clipboard.length === 0) {
						return;
					}
					myThis.DiskData.Clipboard.forEach(item => {
						CopySize = CopySize + parseInt(item.disk_size);
						if (myThis.NowDiskID === item.disk_id) {
							myThis.DiskFeatureControl('clear');
							CutFlag = false;
						}
					});
					if (myThis.DiskData.ClipboardType === 'Copy') {
						if (CopySize > myThis.DiskData.DiskSize.total - myThis.DiskData.DiskSize.use) {
							return myThis.$message.error('空间不足！请清理一些文件后重试');
						}
					} else if (myThis.DiskData.ClipboardType === 'Cut') {
						if (myThis.DiskData.Clipboard[0].parent_id === myThis.NowDiskID) {
							myThis.$message.info('剪切和粘贴目录为同一个，已清空剪贴板');
							return myThis.DiskFeatureControl('clear');
						}
						if (!CutFlag) {
							return myThis.$message.warning('剪贴板内包含粘贴目标，请重新选择');
						}
					}
					myThis.$message.info('正在粘贴文件，请稍候');
					data = myThis.DiskBatchData('post', myThis.DiskData.Clipboard);
					myThis.$Api.Disk[myThis.DiskData.ClipboardType](
						{
							id: data,
							parent_id: myThis.NowDiskID
						},
						rs => {
							rs = rs[0];
							if (rs.state === 'success') {
								let CopyFlag = false; //判断是否有复制和粘贴时同一个目录的
								myThis.DiskData.Clipboard.forEach(item => {
									if (myThis.DiskData.ClipboardType === 'Copy') {
										item.path = item.path + '-复制';
										if (item.parent_id === myThis.NowDiskID) {
											CopyFlag = true;
										}
									}
									item.parent_id = myThis.NowDiskID;
									myThis.UserDiskData.push(item);
								});
								if (CopyFlag) {
									myThis.NavigationControl('reload');
								}
								myThis.$message.success('粘贴成功，共' + myThis.DiskData.Clipboard.length + '个项目');
								myThis.DiskFeatureControl('clear');
							} else {
								myThis.$message.error('粘贴失败');
							}
						}
					);
					break;
				case 'trash': //移入回收站:
					let trash_data = myThis.DiskBatchData();
					data = myThis.DiskBatchData('post', trash_data);
					myThis.$confirm({
						title: '删除',
						content: '是否将所选' + trash_data.length + '个项目彻底删除',
						okText: '删除',
						okType: 'danger',
						cancelText: '取消',
						onOk() {
							myThis.$Api.Disk.Delete(
								{
									id: data
								},
								rs => {
									rs = rs[0];
									if (rs.state === 'success') {
										myThis.$message.success('删除成功');
										myThis.DiskBatchData('remove', delete_data);
									} else {
										myThis.$message.success('删除失败');
									}
								}
							);
						},
						onCancel() {
							console.log('Cancel');
						},
					});
					break;
				case 'delete': //文件删除
					let delete_data = myThis.DiskBatchData();
					data = myThis.DiskBatchData('post', delete_data);
					myThis.$confirm({
						title: '删除',
						content: '是否将所选' + delete_data.length + '个项目彻底删除',
						okText: '删除',
						okType: 'danger',
						cancelText: '取消',
						onOk() {
							console.log('文件删除操作');
						}
					});
					break;
				case 'restore': //文件还原
					let restore_data = myThis.DiskBatchData();
					data = myThis.DiskBatchData('post', restore_data);
					myThis.Confrim({
						title: '还原文件',
						tips: '是否将所选' + restore_data.length + '个项目移出回收站',
						callback: () => {
							myThis.$Api.Disk.Restore(
								{
									id: data
								},
								rs => {
									rs = rs[0];
									if (rs.state === 'success') {
										myThis.$message.success('还原成功');
										myThis.DiskBatchData('remove', restore_data);
									} else {
										myThis.$message.success('还原失败');
									}
								}
							);
						}
					});
					break;
				case 'rename': //重命名
					console.log('重命名未开始');
					// myThis.InputConfrim({
					// 	title: '重命名',
					// 	tips: '请输入新的文件/文件夹名称',
					// 	value: myThis.DiskData.NowSelect.path,
					// 	callback: value => {
					// 		if (value.length === 0) {
					// 			return myThis.$message.error('文件名不能为空');
					// 		}
					// 		myThis.$Api.Disk.Rename(
					// 			{
					// 				name: value,
					// 				id: myThis.DiskData.NowSelect.disk_id
					// 			},
					// 			rs => {
					// 				rs = rs[0];
					// 				if (rs.state === 'success') {
					// 					myThis.UserDiskData[myThis.DiskData.NowIndex].path = value;
					// 					myThis.$message.success('重命名成功');
					// 				} else {
					// 					myThis.$message.error('重命名失败');
					// 				}
					// 			}
					// 		);
					// 	}
					// });
					break;
				case 'info': //文件属性
					console.log('属性未开始');
					break;
				case 'share': //提交文件分享
					console.log('分享未开始');
					break;
				case 'post-share': //查看分享
					myThis.$refs.DiskShareModel.ShareFile(myThis.DiskData.NowSelect);
					break;
				case 'update-share': //更新文件分享状态
					myThis.FindInDisk(myThis.DiskData.NowSelect, item => {
						item.share = datas;
						item.shareAddress = localStorage.server + '/s/' + datas;
					});
					break;
				case 'cancel-share': //取消分享
					myThis.Confrim({
						title: '取消分享',
						tips: '您确认取消分享' + myThis.DiskData.NowSelect.path + '吗',
						callback: () => {
							myThis.$Api.Disk.CancelShare(
								{
									id: myThis.DiskData.NowSelect.disk_id,
									share_id: myThis.DiskData.NowSelect.share
								},
								rs => {
									if (rs[0].state === 'success') {
										myThis.$message.success('分享已取消');
										myThis.$nextTick(() => {
											if (myThis.loadClassify === 'share') {
												let data:any = [];
												data.push(myThis.DiskData.NowSelect);
												myThis.DiskBatchData('remove', data);
											} else {
												myThis.FindInDisk(myThis.DiskData.NowSelect, item => {
													item.share = '';
												});
											}
										});
									} else {
										myThis.$message.error('操作失败');
									}
								}
							);
						}
					});
					break;
				case 'reload':
					myThis.getDeviceInfo()
					break;
				case 'popup':
					if (myThis.ConfigObject.NoticeFlag) {
						myThis.NoticeSrc = localStorage.NoticeVoice;
						let a = setTimeout(() => {
							clearTimeout(a);
							myThis.$refs.NoticeAudio.play();
						}, 200);
					}
					if (myThis.ConfigObject.NoticeBubble) {
						myThis.$notify(datas);
						//myThis.$ipc.send('system', 'popup', datas);
					}
					break;
			}
    },
		/*导航栏函数*/
		NavigationControl(commend) {
			switch (commend) {
				// case 'back': //后退
				// 	if (this.DiskData.NavData.length > 1) {
				// 		this.NavigationControl(this.DiskData.NavData[this.DiskData.NavData.length - 2]);
				// 	} else {
				// 		this.NavigationControl('home');
				// 	}
				// 	break;
				// case 'home': //返回顶层
				// 	if (this.DiskData.Type === 'share') {
				// 		this.SwitchType('share');
				// 		this.NavigationControl('clear');
				// 	} else if (this.NoTransType && this.DiskData.ClassifyName !== '搜索') {
				// 		this.GetMainFile(null, this.loadClassify);
				// 		this.NavigationControl('clear');
				// 	} else if (this.DiskData.ClassifyName === '搜索') {
				// 		this.SwitchType('disk');
				// 		this.NavigationControl('clear');
				// 	}
				// 	break;
				// case 'reload': //刷新
				// 	this.DiskPage = 1;
				// 	this.GetMainFile(this.NowDiskID, this.loadClassify);
				// 	break;
				// case 'clear':
				// 	this.DiskData.NavData = [];
				// 	break;
				// default:
				// 	//默认切换
				// 	for (let i = this.DiskData.NavData.length - 1; i > 0; i--) {
				// 		if (commend === this.DiskData.NavData[i]) {
				// 			break;
				// 		}
				// 		this.DiskData.NavData.splice(i, 1);
				// 	}
				// 	this.GetMainFile(commend.disk_id, 'normal');
				// 	break;
			}
		},
		MainMouseFunc(event) {
      const myThis = this as any
			myThis.$refs.CloudDiskMain.focus();
			if (myThis.NoTransType) {
				myThis.$refs.MouseMenu.MenuShow();
				if (event.button === 0) {
					myThis.MouseSelect(event);
				}
			}
		},
		MouseSelect(event) {
      const myThis = this as any
			event.preventDefault();
			event.stopPropagation();
      let area = event.target;
			let start = {
				x: event.clientX - area.getBoundingClientRect().left + area.scrollLeft + 213,
				y: event.clientY - area.getBoundingClientRect().top + area.scrollTop + 130,
				maxy: area.scrollHeight
			};
			myThis.MouseSelectData.left = start.x;
			myThis.MouseSelectData.top = start.y;
			document.onmouseup = () => {
				myThis.MouseSelectData = {
					left: 0,
					top: 0,
					width: 0,
					height: 0
				};
				document.onmousemove = null;
			};
			document.onmousemove = ev => {
				let end = {
					x: ev.clientX - area.getBoundingClientRect().left + area.scrollLeft + 213,
					y: ev.clientY - area.getBoundingClientRect().top + area.scrollTop + 130,
					scrolldown: Math.min(ev.clientY - area.getBoundingClientRect().top, event.clientY - area.getBoundingClientRect().top) + 10 + area.offsetHeight,
					scrollup: Math.min(ev.clientY - area.getBoundingClientRect().top, event.clientY - area.getBoundingClientRect().top)
				};
				myThis.MouseSelectData = {
					left: Math.min(start.x, end.x) + 'px',
					top: Math.min(start.y, end.y) + 'px',
					width: Math.abs(end.x - start.x) + 'px',
					height: Math.abs(end.y - start.y) + 'px'
				};
				let area_data = {
					left: Math.min(start.x, end.x),
					top: Math.min(start.y, end.y),
					width: Math.abs(end.x - start.x),
					height: Math.abs(end.y - start.y)
				};
				let selList:any = document.getElementsByClassName(myThis.DiskData.DiskShowState);
				myThis.ClearSelect();
				let tempArr = myThis.UserDiskData;
				for (let i = 0; i < selList.length; i++) {
					let sl = selList[i].offsetWidth + selList[i].offsetLeft,
						st = selList[i].offsetHeight + selList[i].offsetTop;
					let area_l = area_data.left + area_data.width;
					let area_t = area_data.top + area_data.height;
					if (sl > area_data.left && st > area_data.top && selList[i].offsetLeft < area_l && selList[i].offsetTop < area_t) {
						if (tempArr[i].active === false) {
								tempArr[i].active = true;
						}
					} else {
						if (tempArr[i].active) {
								tempArr[i].active = false;
						}
					}
				}
				myThis.UserDiskData = myThis.deepCopy(tempArr);
			};
    },
		ClearSelect() {
      const myThis: any = this
			myThis.UserDiskData.forEach(item => {
				item.active = false;
			});
			myThis.DiskData.SelectFiles = [];
		},
    getDeviceInfo () {  // 获取磁盘信息
      const myThis: any = this
      NasFileAPI.storages().then((response): void => {
        if (response.data.code !== 200) {
          myThis.$message.warning(response.data.msg)
          return
        }
        const res = response.data.data
        myThis.getFileList(res.storages[0].partitions[0].uuid);
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
    getFileList(params) { // 获取文件列表
      const myThis: any = this
      NasFileAPI.list('/.ugreen_nas/6001', params).then((response): void => {
        if (response.data.code !== 200) {
          myThis.$message.warning(response.data.msg)
          return
        }
        const res = response.data.data
        myThis.DiskBatchData('print', res.list);
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
		/*批量数据操作*/
		DiskBatchData(commend, data) {
			let BatchData:any = [];
      const myThis: any = this
			commend = commend ? commend : 'select';
			switch (commend) {
				case 'select': //获取选择的文件，生成数组
					if (myThis.DiskData.SelectFiles.length) {
						BatchData = myThis.DiskData.SelectFiles;
					} else {
						BatchData.push(myThis.DiskData.NowSelect);
					}
					break;
				case 'post': //将准备传输的文件数据转换为逗号连接的字符串
					BatchData = '';
					for (let j = 0; j < data.length; j++) {
						BatchData = BatchData + data[j].disk_id + ',';
					}
					BatchData = BatchData.substring(0, BatchData.length - 1);
					break;
				case 'remove': //将网盘上的data数据remove
					for (let i = 0; i < myThis.UserDiskData.length; i++) {
						for (let j = 0; j < data.length; j++) {
							if (data[j].disk_id === myThis.UserDiskData[i].disk_id) {
								myThis.UserDiskData.splice(i, 1);
							}
						}
					}
					break;
				case 'print':
					if (myThis.DiskPage === 1) {
						myThis.DiskAllCount = 0;
						myThis.DiskLoadCount = 0;
					}
					myThis.LoadCompany = true;
					myThis.UserDiskData = data
					if (data.length) {
						myThis.DiskData.DiskSize.total = data[0].max_size;
						myThis.DiskData.DiskSize.use = data[0].use_size;
						// myThis.DiskData.DiskSize.text = '可用:' + myThis.$Api.Disk.FileSize(myThis.DiskData.DiskSize.total - myThis.DiskData.DiskSize.use);
						myThis.DiskAllCount = data[0].all_count;
						myThis.DiskLoadCount = myThis.DiskLoadCount + data.length;
					}
					break;
			}
			return BatchData;
    },
		/*获取用户文件*/
		GetMainFile(id, type) {
      const myThis: any = this
			if (myThis.DiskData.Type === 'trans') {
				return;
			}
			if (myThis.DiskPage === 1) {
				myThis.UserDiskData = []; //清空数据
				myThis.LoadCompany = false;
			}
			if (!id) {
				id = 'null';
			}
			if (myThis.loadClassify !== type) {
				myThis.DiskLoadCount = 0;
				myThis.DiskPage = 1;
				myThis.LoadCompany = false;
			}
			myThis.NowDiskID = id;
			myThis.loadClassify = type;
			// myThis.$Api.Disk.LoadMainFile(
			// 	{
			// 		id: id,
			// 		page: myThis.DiskPage,
			// 		loadtype: myThis.loadClassify
			// 	},
			// 	rs => {
			// 		myThis.DiskBatchData('print', rs);
			// 	}
			// );
		},
		/*选择文件数据操作方法*/
		SelectFiles(event, item, index) {
      const myThis: any = this
			console.log(event);
			myThis.$refs.CloudDiskMain.focus();
			myThis.$refs.MouseMenu.MenuShow('file');
			if (event.button === 0) {
				event.stopPropagation();
				if (myThis.DiskData.KeyFlag === 'Ctrl') {
					//Ctrl多选
					item.active = !item.active; //反选
				} else if (myThis.DiskData.KeyFlag === 'Shift') {
					//Shift多选
					let Start = index,
						End;
					item.active = true;
					if (myThis.DiskData.NowSelect) {
						for (let i = 0; i < myThis.UserDiskData.length; i++) {
							if (myThis.UserDiskData[i] === myThis.DiskData.NowSelect) {
								Start = i;
							}
							if (myThis.UserDiskData[i] === item) {
								End = i;
							}
						}
					}
					for (let j = Math.min(End, Start); j < Math.max(End, Start) + 1; j++) {
						myThis.UserDiskData[j].active = true;
					}
				} else if (!myThis.DiskData.KeyFlag) {
					//单选
					myThis.ClearSelect();
					item.active = true;
					myThis.DiskData.NowIndex = index; //记录当前是第几个
					myThis.DiskData.NowSelect = item;
				}
			} else if (event.button === 2) {
				myThis.DiskData.NowIndex = index;
				myThis.DiskData.NowSelect = item;
			}
		},
		// 深拷贝
		deepCopy (obj) {
			let result = [];
			for (let key in obj) {
				if (typeof obj[key] === 'object') {
					result[key] = this.deepCopy(obj[key])
				} else {
					result[key] = obj[key]
				}
			} 
			return result
    }
  }
}
</script>

<style lang="less" scoped>
/*上传提示*/
.cd-upload-tips {
	width: 100%;
	height: 35px;
	line-height: 35px;
	background: #01B74F;
	position: relative;
	text-indent: 20px;
	top: -2px;
	z-index: 3;
	-webkit-animation-duration: 0.35s;
	animation-duration: 0.35s;
	-webkit-animation-fill-mode: both;
	animation-fill-mode: both;
	-webkit-animation-name: slideInDown;
	animation-name: slideInDown;
	color: #fff;
}
.resource-list {
  overflow: auto;
  .demo-loading-container {
    position: absolute;
    bottom: 40px;
    width: 100%;
    text-align: center;
  }
}
.horizontalResourceList {
  padding: 20px 20px 0px;
  background-color: white;
}
/*分享提示*/
.cd-share-select {
	font-size: 16px;
	padding-bottom: 5px;
	height: 25px;
}
.cd-share-select span {
	color: #5b5bea;
}
/*拖选框*/
.cd-mouse-select {
	position: absolute;
	background: #DEF1EA;
	opacity: 0.7;
	border: 2px solid #01b74f7a;
	z-index: 1;
}
</style>

<style>
.resource-list .ant-list-header {
  padding: 0px;
}
.resource-list .ant-list-item {
  margin: 0px;
}
</style>
