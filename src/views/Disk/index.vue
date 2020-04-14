<template>
  <a-layout>
		<a-layout-sider class="base-sider">
			<i-logo/>
			<sider-menu/>
		</a-layout-sider>
		<a-layout>
			<a-layout-header class="base-header">
				<basic-header/>
			</a-layout-header>
			<a-layout-content>
				<template>
					<resource-header v-if="isShowHeader"/>
					<div class="cd-upload-tips" v-show="ShowUploadTips && DiskData.Type === 'disk' && loadClassify === 'normal'">松开鼠标开始上传文件</div>
					<DiskSortBar
						:show="DiskData.DiskShowState !== 'cd-disk-block-file' && NoTransType"
						:DiskData="UserDiskData"
						@callback="DiskFeatureControl"
						ref="DiskSortBar"
					/>
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
							<DiskFile @SelectFiles="SelectFiles" @OpenFile="DiskFeatureControl" v-if="LoadCompany && NoTransType" :data="UserDiskData" :DiskData="DiskData" />
							
							<template v-if="DiskData.Type === 'transport'">
								<TransportList @ControlTrans="ControlTrans" :data="TransformData"/>
							</template>
							<audio :src="NoticeSrc" ref="NoticeAudio" />
						</div>
					</section>
					<input type="file" id="FileArea" @change="PrepareUploadFile" hidden ref="FileArea" multiple="multiple" />
					<MouseMenu :type="loadClassify" :node="$refs.CloudDiskMain" :DiskData="DiskData" @callback="DiskFeatureControl" ref="MouseMenu" />
					<a-modal
						:visible="fileNameVisible" :mask="false" :closable="false" :maskClosable="false"
						okText="创建" cancelText="取消" @ok="handleCreateFile" @cancel="cancleCreateFile">
						文件夹名称：<a-input placeholder="请输入文件夹名称" v-model="fileName" />
					</a-modal>
					<a-modal
						:visible="fileRenameVisible" :mask="false" :closable="false" :maskClosable="false"
						okText="确定" cancelText="取消" @ok="handleRenameFile" @cancel="cancleRenameFile">
						文件重命名：<a-input placeholder="请输入文件新名称" v-model="fileName" />
					</a-modal>
				</template>
			</a-layout-content>
			<a-layout-footer class="base-footer">
				<!-- <basic-footer/> -->
			</a-layout-footer>
		</a-layout>
	</a-layout>
</template>

<script lang="ts">
import Vue from 'vue'
import ILogo from '../../components/Logo/index.vue'
import SiderMenu from '../../components/SiderMenu/index.vue'
import BasicHeader from '../../components/BasicHeader/index.vue'
import { CategoryType } from '../../model/categoryList'
import DiskFile from '../../components/Disk/DiskFile.vue'
import MouseMenu from '../../components/Disk/MouseMenu.vue'
import DiskSortBar from '../../components/Disk/DiskSortBar.vue';
import ResourceHeader from '../../components/ResourceList/ResourceHeader.vue'
// import BasicFooter from '../../components/BasicFooter/index.vue'
import TransportList from '../../components/TransportList/index.vue'
import infiniteScroll from 'vue-infinite-scroll'
import { ArrangeWay, ResourceItem } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { TRANSFORM_INFO, USER_MODEL } from '../../common/constants'
import { EventBus, EventType } from '../../utils/eventBus'
import processCenter, { EventName } from '../../utils/processCenter'
import upload from '../../utils/file/upload';
import StringUtility from '../../utils/StringUtility'
import { isResponsePass } from '../../utils/request'
import _ from 'lodash'

export default {
  name: 'disk',
  directives: { infiniteScroll },
  components: {
    ResourceHeader,
		DiskFile,
		MouseMenu,
		DiskSortBar,
		TransportList,
		// BasicFooter,
    ILogo,
    SiderMenu,
    BasicHeader
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
				Type: 'disk', //头部分类标签,
				ClassifyName: '网盘', //地址栏左侧分类显示文本,
			},
			fileName: '',	// 新建文件名
			fileNameVisible: false,	// 创建文件夹
			fileRenameVisible: false,	// 文件重命名
			TransformData: [],
			/*上传提示*/
      loading: false,
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
			ConfigObject: {
				NoticeFlag: true,
				NoticeBubble: true
			},
			NoticeSrc: '',
			/*上传提示*/
			ShowUploadTips: false,
			/*文件传输列表参数*/
			SelectDownLoadFiles: [], //选择下载的文件
			deviceUuid: '',
			currentType: 'all',
			currentShareUser: '',	// 分享模块下的当前用户
			isShareDetail: false	// 当前是否为分享模块的详情
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
				if (myThis.DiskData.Type === 'transport') {
					myThis.$nextTick(() => {
						console.log(myThis.TransformData);
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
					myThis.$store.dispatch('Resource/updateShowItemCount', '已选中' + myThis.DiskData.SelectFiles.length)
				} else {
					myThis.$store.dispatch('Resource/updateShowItemCount', '全部' + myThis.UserDiskData.length)
				}
			},
			deep: true
		},
		TransformData: {
			handler() {
				const myThis = this as any
				// console.log(JSON.parse(JSON.stringify(myThis.TransformData)));
				myThis.$nextTick(() => {
					myThis.UploadCount = 0;
					myThis.DownloadCount = 0;
					myThis.FinishCount = 0;
					myThis.TransformData.forEach((item, index) => {
						if (item.state === 'cancelled') {
							myThis.TransformData.splice(index, 1);
						}
						if (item.trans_type === 'upload' && item.state !== 'completed') {
							myThis.UploadCount++;
						}
						if (item.trans_type === 'download' && item.state !== 'completed') {
							myThis.DownloadCount++;
						}
						if (item.state === 'completed') {
							myThis.FinishCount++;
						}
						item.shows = myThis.loadClassify === item.state || (item.trans_type === myThis.loadClassify && item.state !== 'completed');
					});
					// myThis.$refs.DiskClassify.TransData[0].count = myThis.DownloadCount;
					// myThis.$refs.DiskClassify.TransData[1].count = myThis.UploadCount;
					// myThis.$refs.DiskClassify.TransData[2].count = myThis.FinishCount;
				});
				// console.log(JSON.parse(JSON.stringify(myThis.TransformData)));
				// LocalFile.write('transfer', myThis.TransformData);
				myThis.$resetSetItem(TRANSFORM_INFO, JSON.stringify(myThis.TransformData))
				EventBus.$emit(EventType.downloadChangeAction, null)
			},
			deep: true
		}
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
			return myThis.DiskData.Type !== 'transport';
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
		myThis.getLatelyFileList()
		const temp:any = localStorage.getItem(TRANSFORM_INFO)
		let tempJson = JSON.parse(temp)
		myThis.TransformData = tempJson !== null ? tempJson : []
  },
	created() {
    const myThis = this as any
		myThis.Bind();
		const path = require('path');
		myThis.NoticeSrc = myThis.$path.join(__filename, '../../../../../../../public/voice/1.mp3')
	},
  methods: {
		/*初始化*/
		Bind: function() {
			const myThis = this as any
			window.addEventListener('dragenter',
				function(e) { e.preventDefault(); },
				false
			);
			window.addEventListener('dragover',
				function(e) { e.preventDefault(); },
				false
			);
			window.addEventListener('dragleave',
				function(e) { e.preventDefault(); },
				false
			);
			window.addEventListener('drop',
				function(e) { e.preventDefault(); },
				false
			);
			myThis.$ipc.on('download', (e, file, completed) => {
				completed && myThis.DiskFeatureControl('popup', file.name + '下载完成'); /*消息提醒*/
				// localStorage.setItem(TRANSFORM_INFO, JSON.stringify(myThis.TransformData))
				myThis.$resetSetItem(TRANSFORM_INFO, JSON.stringify(myThis.TransformData))
				// console.log(JSON.parse(JSON.stringify(myThis.TransformData)));
				for (let i = 0; i < myThis.TransformData.length; i++) {
					if (file.name === myThis.TransformData[i].name) {
						myThis.$nextTick(() => {
							for (let name in myThis.TransformData[i]) {
								myThis.TransformData[i][name] = file[name];
							}
						});
						return;
					}
				}
				myThis.$nextTick(() => {
					myThis.TransformData.push(file);
				});
			});
			// myThis.$ipc.on('win-data', (e, data) => {
			// 	//接收用户配置文件
			// 	console.log('重新登录进来就开始下载操作');
			// 	myThis.$Api.LocalFile.read('transfer', data => {
			// 		if (data.length) {
			// 			myThis.TransformData = data;
			// 			myThis.TransformData.forEach(item => {
			// 				if (item.trans_type === 'download' && item.state !== 'completed') {
			// 					myThis.$electron.remote.getCurrentWindow().webContents.downloadURL(item.disk_main + '?disk_name=' + item.disk_name);
			// 				}
			// 			});
			// 		}
			// 	});
			// 	myThis.$Api.LocalFile.read('setting', data => {
			// 		myThis.ConfigObject = data;
			// 		myThis.$ipc.send('system', 'download-update', data.TransDownFolder);
			// 	});
			// })
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
      EventBus.$on(EventType.backAction, () => {	// 路由器返回
        // TODO: 在有多级目录时，这里应该设置一个数据栈
        myThis.currentArray = myThis.dataSource
        myThis.directoryList = myThis.currentArray
        myThis.$store.dispatch('Resource/popPath')
      })
      EventBus.$on(EventType.categoryChangeAction, (type: CategoryType) => {	// 切换顶部目录
				if (['download', 'upload', 'offline', 'remote'].indexOf(type) > -1) return	// 过滤任务下的筛选条件
				myThis.currentType = type
				myThis.distributeQuery();
      })
      EventBus.$on(EventType.arrangeChangeAction, (way: ArrangeWay) => {	// 切换格子、列表样式
				myThis.DiskData.DiskShowState = way === 0 ? 'cd-disk-block-file' : 'cd-disk-list-file';
			})
      EventBus.$on(EventType.transportChangeAction, (data) => {	// 上传下载
				data.action && data.action === 'clearAllFinish' ? myThis.TransformData = [] : null
			})
      EventBus.$on(EventType.leftMenuChangeAction, (path: any) => {	// 切换左侧目录
				const pathStr = StringUtility.formatName(path)
				myThis.SwitchType(pathStr)
        myThis.$store.dispatch('Resource/updatePath', StringUtility.pathToName(pathStr))	// 更新路由
				myThis.isShareDetail = false	// 重置分享为用户列表
				if (pathStr === 'disk') {
					myThis.loadClassify = 'disk'
				} else if (pathStr === 'transport') {

				} else if (pathStr === 'storage') {
					myThis.loadClassify = 'storage'
				} else if (pathStr === 'collect') {
					myThis.loadClassify = 'collect'
				} else if (pathStr === 'share') {
					myThis.loadClassify = 'share'
				} else {
					myThis.loadClassify = 'normal'
				}
				myThis.distributeQuery();
			})
			EventBus.$on(EventType.refreshAction, () => {	// 刷新
				myThis.distributeQuery();
			})
    },
    handleInfiniteOnLoad () {
      const myThis = this as any
      console.log('load more data')
      // EventBus.$emit(EventType.categoryChangeAction, item.type)
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
			upload.prepareFile(data, {
				data: myThis.NowDiskID,
				add: file => {
					console.log(file);
					myThis.TransformData.push(file);
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
					myThis.$resetSetItem(TRANSFORM_INFO, JSON.stringify(myThis.TransformData))
					myThis.UserDiskData.push(file);
					myThis.distributeQuery();
					myThis.$message.success('文件上传成功！')
					myThis.DiskFeatureControl('popup', file.name + '上传完成'); /*消息提醒*/
				}
			});
		},
    // 获取到菜单返回的结果
    DiskFeatureControl (commend: any, datas: any, flag) {
      const myThis = this as any
			let data = null;
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
			console.log(commend);
			switch (commend) {
				case 'open' /*打开文件夹/文件*/:
					let item = datas;
					if (!item) {
						item = myThis.DiskData.NowSelect;
					}
					if (item.isUser) {
						console.log(item);
						myThis.currentShareUser = item.ugreen_no
						myThis.getShareList();
						myThis.isShareDetail = true	// 打开后进入分享详情
						return
					}
					if (!item.path) {
						myThis.DiskData.NavData.push(item);
						myThis.ClearSelect();
						myThis.GetMainFile(item.disk_id, 'normal');
					} else {
						let OpenType = myThis.DiskData.NowSelect.type;
						// 0: Unknown 1: Video, 2: Audio, 3:Image, 4:Document, 5:Archive, 6:Folder
						const filterArr = [1, 2, 3, 4];
						if (filterArr.indexOf(OpenType) > -1) {
							console.log(myThis.UserDiskData);
							let data:any = myThis.UserDiskData.filter(item => item.active)
							setTimeout(() => {
								console.log(JSON.parse(JSON.stringify(data[0])));
								myThis.$ipc.send('file-control', OpenType, data);
							}, 400);
						} else if (OpenType === 5) {	// 包含zip
							let data:any = myThis.UserDiskData.filter(item => item.active)
							console.log(JSON.parse(JSON.stringify(data[0])));
							const filterCompress = ['.zip', '.rar', '.7z', '.ZIP', '.RAR', '.7Z']
							const compressRes = filterCompress.filter(item => data[0].path.indexOf(item) > -1)
							if (compressRes.length > 0) {	// 压缩类型
								myThis.showTree = true;
								myThis.ShowUnZip = true;
							} else {	// pdf
								myThis.$ipc.send('file-control', OpenType, data);
							}
						} else if (OpenType === 6) {	// 文件夹
							myThis.$store.dispatch('Resource/pushPath', StringUtility.formatName(item.path))
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
					if (myThis.DiskData.SelectFiles.length) {
						myThis.DiskData.SelectFiles.forEach(item => {
							if (item.path) {
								myThis.SelectDownLoadFiles.push(item);
							}
						});
					} else {
						if (myThis.DiskData.NowSelect) {
							myThis.SelectDownLoadFiles.push(myThis.DiskData.NowSelect);
						}
					}
					EventBus.$emit(EventType.downloadChangeAction, null)
					let tips = myThis.SelectDownLoadFiles.length > 1 ? '所选' + myThis.SelectDownLoadFiles.length + '个项目' : myThis.SelectDownLoadFiles[0].path;
					myThis.SelectDownLoadFiles.forEach(item => {
						if (item.trans_type === 'download' && item.state !== 'completed') {
							myThis.$electron.remote.getCurrentWindow().webContents.downloadURL(NasFileAPI.download(item));
						}
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
					// TODO: 请求接口
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
					myThis.fileNameVisible = true;
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
						// TODO: 据说不需要前端判断磁盘空间问题，后台接口返回
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
					// TODO: 请求接口
					break;
				case 'delete': //文件删除
					let delete_data = myThis.DiskBatchData();
					data = myThis.DiskBatchData('post', delete_data);
					myThis.$electron.shell.beep()
					myThis.$confirm({
						title: '删除',
						content: '是否将所选' + delete_data.length + '个项目彻底删除',
						okText: '删除',
						okType: 'danger',
						cancelText: '取消',
						onOk() {
							const tempData:any = myThis.DiskData.NowSelect
							const body ={
								"type": 4,
								"data": {
									"mode": 1,
									"files": [ { "path": tempData.path, "uuid": tempData.uuid } ]
								}
							}
							NasFileAPI.deleteFile(body).then((response): void => {
								if (!isResponsePass(response)) return
								myThis.distributeQuery();
								myThis.$message.success('删除成功！')
							}).catch((error): void => {
								console.log(error);
								myThis.$message.error('网络连接错误,请检测网络')
							})
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
							// TODO: 请求接口
						}
					});
					break;
				case 'rename': //重命名
					myThis.fileRenameVisible = true;
					const tempName = myThis.DiskData.NowSelect.path
					myThis.fileName = StringUtility.formatName(tempName)
					break;
				case 'info': //文件属性
					console.log(JSON.parse(JSON.stringify(myThis.DiskData.NowSelect)));
					setTimeout(() => {
						myThis.$ipc.send('file-control', 0, myThis.DiskData.NowSelect);
					}, 400);
					break;
				case 'share': //提交文件分享
					const tempData:any = myThis.DiskData.NowSelect
					console.log(tempData);
					const body ={
						"files": [
							{ "uuid": tempData.uuid, "path": tempData.path }
						]
					}
					NasFileAPI.shareFile(body).then((response): void => {
						if (!isResponsePass(response)) return
						myThis.distributeQuery();
						myThis.$message.success('分享成功！')
					}).catch((error): void => {
						console.log(error);
						myThis.$message.error('网络连接错误,请检测网络')
					})
					break;
				case 'cancel-share': //取消分享
					let share_data = myThis.DiskBatchData();
					myThis.$electron.shell.beep()
					myThis.$confirm({
						title: '取消分享',
						content: '是否取消分享所选' + share_data.length + '个项目',
						okText: '取消分享',
						okType: 'danger',
						cancelText: '取消',
						onOk() {
							const tempData:any = myThis.DiskData.NowSelect
							const body ={
								"files": [{ "path": share_data[0].path, "uuid": share_data[0].uuid }]
							}
							NasFileAPI.cancleShareFile(body).then((response): void => {
								if (!isResponsePass(response)) return
								myThis.getShareList()
								myThis.$message.success('取消分享成功！')
							}).catch((error): void => {
								console.log(error);
								myThis.$message.error('网络连接错误,请检测网络')
							})
						}
					});
					break;
				case 'reload':
					myThis.distributeQuery();
					break;
				case 'favourite':
					myThis.favouriteFile()
					break;
				case 'cancel-favourite':
					let favourite_data = myThis.DiskBatchData();
					myThis.$electron.shell.beep()
					myThis.$confirm({
						title: '取消收藏',
						content: '是否取消收藏所选' + favourite_data.length + '个项目',
						okText: '取消收藏',
						okType: 'danger',
						cancelText: '取消',
						onOk() {
							const tempData:any = myThis.DiskData.NowSelect
							const body ={
								"files": [{ "path": favourite_data[0].path, "uuid": favourite_data[0].uuid }]
							}
							NasFileAPI.cancelFavouriteFile(body).then((response): void => {
								if (!isResponsePass(response)) return
								myThis.getFavouriteList()
								myThis.$message.success('取消收藏成功！')
							}).catch((error): void => {
								console.log(error);
								myThis.$message.error('网络连接错误,请检测网络')
							})
						}
					});
					break;
				case 'popup':
					if (myThis.ConfigObject.NoticeFlag) {
						let a = setTimeout(() => {
							clearTimeout(a);
							myThis.$refs.NoticeAudio.play();
						}, 200);
					}
					if (myThis.ConfigObject.NoticeBubble) {
						myThis.$ipc.send('system', 'popup', datas);
					}
					break;
			}
		},
		handleCreateFile() {	// 创建文件
      const myThis = this as any
			if (myThis.fileName.length === 0) {
				return myThis.$message.error('文件夹名称不能为空');
			}
			const tempData:any = myThis.UserDiskData[0]
			const body ={
				"uuid": tempData.uuid,
				"path": tempData.path.substring(0, tempData.path.lastIndexOf("/") + 1) + myThis.fileName,
				"type": 2,
				"alias": myThis.fileName
			}
      NasFileAPI.addFile(body).then((response): void => {
				if (!isResponsePass(response)) return
				myThis.distributeQuery();
				myThis.fileName = ''
				myThis.fileNameVisible = false
      }).catch((error): void => {
				console.log(error);
        myThis.$message.error('网络连接错误,请检测网络')
      })
		},
		handleRenameFile(data) {	// 重命名文件
      const myThis = this as any
			if (myThis.fileName.length === 0) {
				return myThis.$message.error('文件夹名称不能为空');
			}
			const tempData:any = myThis.DiskData.NowSelect
      NasFileAPI.renameResource(tempData.path, tempData.path.substring(0, tempData.path.lastIndexOf("/") + 1) + myThis.fileName, tempData.uuid).then(response => {
        console.log(response)
				if (!isResponsePass(response)) return
				myThis.fileRenameVisible = false
				myThis.fileName = ''
				myThis.distributeQuery();
      }).catch(error => {
        myThis.loading = false
        myThis.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		cancleCreateFile() {	// 关闭创建文件弹框
      const myThis = this as any
			myThis.fileNameVisible = false
		},
		cancleRenameFile() {	// 关闭重命名文件弹框
      const myThis = this as any
			myThis.fileRenameVisible = false
		},
		/*切换顶部网盘分享、传输类型*/
		SwitchType(type) {
			const myThis = this as any
			myThis.NavigationControl('clear');
			myThis.DiskData.Type = type;
		},
		/*导航栏函数*/
		NavigationControl(commend) {
      const myThis = this as any
			switch (commend) {
				case 'back': //后退
					if (myThis.DiskData.NavData.length > 1) {
						myThis.NavigationControl(myThis.DiskData.NavData[myThis.DiskData.NavData.length - 2]);
					} else {
						myThis.NavigationControl('home');
					}
					break;
				case 'home': //返回顶层
					if (myThis.DiskData.Type === 'share') {
						myThis.SwitchType('share');
						myThis.NavigationControl('clear');
					} else if (myThis.NoTransType && myThis.DiskData.ClassifyName !== '搜索') {
						myThis.GetMainFile(null, myThis.loadClassify);
						myThis.NavigationControl('clear');
					} else if (myThis.DiskData.ClassifyName === '搜索') {
						myThis.SwitchType('disk');
						myThis.NavigationControl('clear');
					}
					break;
				case 'reload': //刷新
					myThis.DiskPage = 1;
					myThis.GetMainFile(myThis.NowDiskID, myThis.loadClassify);
					break;
				case 'clear':
					myThis.DiskData.NavData = [];
					break;
				default:
					//默认切换
					for (let i = myThis.DiskData.NavData.length - 1; i > 0; i--) {
						if (commend === myThis.DiskData.NavData[i]) {
							break;
						}
						myThis.DiskData.NavData.splice(i, 1);
					}
					myThis.GetMainFile(commend.disk_id, 'normal');
					break;
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
				x: event.clientX - area.getBoundingClientRect().left + area.scrollLeft + 201,
				y: event.clientY - area.getBoundingClientRect().top + area.scrollTop + 112,
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
					x: ev.clientX - area.getBoundingClientRect().left + area.scrollLeft + 201,
					y: ev.clientY - area.getBoundingClientRect().top + area.scrollTop + 112,
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
				myThis.UserDiskData = _.cloneDeep(tempArr);
			};
    },
		ClearSelect() {
      const myThis: any = this
			myThis.UserDiskData.forEach(item => { item.active = false });
			myThis.DiskData.SelectFiles = [];
		},
		ControlTrans(item, index, event) {
			const myThis: any = this
			console.log(item);
			if (event.target.className === 'sf-icon-times') {
				if (item.trans_type === 'download') {
					myThis.$ipc.send('download', 'cancel', item.id);
				}
				return myThis.TransformData.splice(index, 1);
			}
			if (item.state === 'completed') {
				return myThis.TransformData.splice(index, 1);
			}
			if (item.trans_type === 'upload') {
				item.state = item.state === 'interrupted' ? 'progressing' : 'interrupted';
				myThis.PrepareUploadFile(item);
			} else {
				console.log('123');
				let commend = item.state === 'progressing' ? 'pause' : 'resume';
				myThis.$ipc.send('download', commend, item.id);
			}
		}, //传输任务控制
		distributeQuery () {	// 集中分发管理请求
      const myThis: any = this
			if (myThis.DiskData.Type === 'disk') {
				myThis.getLatelyFileList()
			} else if (myThis.DiskData.Type === 'transport') {

			} else if (myThis.DiskData.Type === 'storage') {
				myThis.getDeviceInfo();
			} else if (myThis.DiskData.Type === 'collect') {
				myThis.getFavouriteList()
			} else if (myThis.DiskData.Type === 'share') {
				if (myThis.isShareDetail) {	// 分享详情
					myThis.getShareList()
				} else {	// 分享用户列表
					myThis.getUserList()
				}
			} else {
				myThis.getLatelyFileList()
			}
		},
		getDeviceInfo () {  // 获取磁盘信息
      const myThis: any = this
			if (myThis.deviceUuid !== '') {	// 处理频繁访问获取磁盘信息接口
				myThis.getFileList();
				return
			}
      NasFileAPI.storages().then((response): void => {
				if (!isResponsePass(response)) return
				myThis.deviceUuid = response.data.data.storages[0].partitions[0].uuid 
				myThis.getFileList();
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
    getFileList() { // 获取文件列表
      const myThis: any = this
			const userJson = localStorage.getItem(USER_MODEL)
			let ugreenNo = '';
			if (userJson !== null) {
				ugreenNo = JSON.parse(userJson).ugreenNo
			}
      NasFileAPI.list('/.ugreen_nas/' + ugreenNo, myThis.deviceUuid).then((response): void => {
				if (!isResponsePass(response)) return
        const res = response.data.data
				myThis.LoadCompany = true;
				if (myThis.currentType === 'all') {
					myThis.UserDiskData = res.list
				} else {
					let newArr:any = []
					res.list.forEach(item => {
						if (StringUtility.suffixToTpe(StringUtility.formatSuffix(item.path)) === myThis.currentType) { newArr.push(item) }
					})
					myThis.UserDiskData = newArr
				}
				console.log(JSON.parse(JSON.stringify(myThis.UserDiskData)));
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
		},
    getUserList() { // 获取分享用户列表
			const myThis: any = this
      NasFileAPI.userList().then((response): void => {
				if (!isResponsePass(response)) return
        const res = response.data.data
				myThis.LoadCompany = true;
				let newArr:any = []
				res.nas_users.forEach(item => {
					newArr.push({
						"ugreen_no": item.ugreen_no,
						"nick_name": item.nick_name,
						"type": 6,
						"isUser": true
					})
				})
				if (myThis.currentType === 'all') {
					myThis.UserDiskData = newArr
				} else {
					myThis.UserDiskData = newArr.filter(item => {
						item.type === myThis.currentType
					})
				}
				console.log(JSON.parse(JSON.stringify(myThis.UserDiskData)));
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
    getShareList() { // 获取分享文件详情列表
      const myThis: any = this
			const body = {"nas_users": [{ "ugreen_no": myThis.currentShareUser }]};
      NasFileAPI.shareList(body).then((response): void => {
				if (!isResponsePass(response)) return
        const res = response.data.data
				myThis.LoadCompany = true;
				if (myThis.currentType === 'all') {
					myThis.UserDiskData = res.files
				} else {
					let newArr:any = []
					res.files.forEach(item => {
						if (StringUtility.suffixToTpe(StringUtility.formatSuffix(item.path)) === myThis.currentType) { newArr.push(item) }
					})
					myThis.UserDiskData = newArr
				}
				console.log(JSON.parse(JSON.stringify(myThis.UserDiskData)));
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
    favouriteFile() { // 收藏文件
      const myThis: any = this
			const body = { "files": [{ "uuid": myThis.deviceUuid, "path": myThis.DiskData.NowSelect.path }] }
      NasFileAPI.favouriteFile(body).then((response): void => {
				if (!isResponsePass(response)) return
				myThis.$message.success('文件已收藏')
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
    cancelFavouriteFile() { // 收藏文件
      const myThis: any = this
			const body = { "files": [{ "uuid": myThis.deviceUuid, "path": myThis.DiskData.NowSelect.path }] }
      NasFileAPI.cancelFavouriteFile(body).then((response): void => {
				if (!isResponsePass(response)) return
				myThis.$message.success('文件已收藏')
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
    getFavouriteList() { // 获取收藏列表
      const myThis: any = this
      NasFileAPI.favouriteList().then((response): void => {
				if (!isResponsePass(response)) return
        const res = response.data.data
				myThis.LoadCompany = true;
				if (myThis.currentType === 'all') {
					myThis.UserDiskData = res.files
				} else {
					let newArr:any = []
					res.files.forEach(item => {
						if (StringUtility.suffixToTpe(StringUtility.formatSuffix(item.path)) === myThis.currentType) { newArr.push(item) }
					})
					myThis.UserDiskData = newArr
				}
				console.log(JSON.parse(JSON.stringify(myThis.UserDiskData)));
      }).catch((error): void => {
        console.log(error)
        myThis.$message.error('网络连接错误,请检测网络')
      })
    },
    getLatelyFileList() { // 获取最近
			const myThis: any = this
			const input = {
				"page": 1,
				"size": 100,
				"order": 1
			}
      NasFileAPI.ulist(input).then((response): void => {
				if (!isResponsePass(response)) return
        const res = response.data.data
				myThis.LoadCompany = true;
				if (myThis.currentType === 'all') {
					myThis.UserDiskData = res.list
				} else {
					let newArr:any = []
					res.list.forEach(item => {
						if (StringUtility.suffixToTpe(StringUtility.formatSuffix(item.path)) === myThis.currentType) { newArr.push(item) }
					})
					myThis.UserDiskData = newArr
				}
				console.log(JSON.parse(JSON.stringify(myThis.UserDiskData)));
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
			}
			return BatchData;
    },
		/*获取用户文件*/
		GetMainFile(id, type) {
      const myThis: any = this
			if (myThis.DiskData.Type === 'transport') {
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
				myThis.DiskPage = 1;
				myThis.LoadCompany = false;
			}
			myThis.NowDiskID = id;
			myThis.loadClassify = type;
			// TODO: 请求接口
		},
		/*选择文件数据操作方法*/
		SelectFiles(event, item, index) {
      const myThis: any = this
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
  },
  destroyed () {
    const myThis = this as any
    window.removeEventListener('resize', myThis.observerWindowResize)
    EventBus.$off(EventType.backAction)
    EventBus.$off(EventType.categoryChangeAction)
		EventBus.$off(EventType.arrangeChangeAction)
		EventBus.$off(EventType.leftMenuChangeAction)
		EventBus.$off(EventType.downloadChangeAction)
		EventBus.$off(EventType.refreshAction)
		EventBus.$off(EventType.transportChangeAction)
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
  padding: 20px 15px 0px;
  background-color: white;
}
/*分享提示*/
.cd-share-select {
	font-size: 16px;
	padding-bottom: 5px;
	height: 25px;
}
.cd-share-select span {
	color: #01B74F;
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
.base-footer {
  height: 17px;
  background-color: #edf1f0;
  padding: 0px;
}
</style>

<style lang="scss" scoped>
.base-sider {
  height: 100vh;
  width: 200px;
  background-color: #edf1f0;
}
.base-header {
  height: 110px;
  padding: 0px;
  background-color: white;
}
.base-content {
  padding: 0px;
  background-color: #f6f8fb;
}
.base-footer {
  height: 17px;
  background-color: #edf1f0;
  padding: 0px;
}
</style>
