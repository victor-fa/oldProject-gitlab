<template>
	<div>
    <resource-header v-if="isShowHeader"/>
    <div class="cd-upload-tips" v-show="ShowUploadTips">松开鼠标开始上传文件</div>
    <div class="cd-upload-tips" v-show="ShowUploadTips && DiskData.Type === 'disk' && loadClassify === 'normal'">松开鼠标开始上传文件</div>
    <div class="cd-mouse-select" v-show="MouseSelectData.width" :style="MouseSelectData" />
    <DiskFile @SelectFiles="SelectFiles" @OpenFile="DiskFeatureControl" v-if="LoadCompany && NoTransType" :data="UserDiskData" :DiskData="DiskData" />
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
      <MouseMenu :type="loadClassify" :node="$refs.CloudDiskMain" :DiskData="DiskData" @callback="DiskFeatureControl" ref="MouseMenu" />
			<section
				class="cd-bottom"
				@mousedown="MainMouseFunc"
				@dragover.prevent.stop="ShowUploadTips = true"
				@dragleave.prevent.stop="ShowUploadTips = false"
				ref="CloudDiskMain"
			>
        <a-list
          :dataSource="currentArray"
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
        </a-list>
        
			</section>
    </div>
    <operate-list-alter
      ref="operateListAlter"
      :style="alterStyle"
      @blur="alterBlur"
      @callback="DiskFeatureControl"
    />
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import infiniteScroll from 'vue-infinite-scroll'
import { EventBus, EventType } from '../../utils/eventBus'
import processCenter, { EventName } from '../../utils/processCenter'
import { ArrangeWay, ResourceItem } from './ResourceModel'
import { CategoryType } from '../../components/BasicHeader/Model/categoryList'
import DiskFile from '../Disk/DiskFile.vue'
import MouseMenu from '../Disk/MouseMenu.vue'
import ResourceListItem from './ResourceListItem.vue'
import ResourceHeader from './ResourceHeader.vue'
import OperateListAlter from '../OperateListAlter/index.vue'
import upload from '../../utils/file/upload';
import NasFileAPI from '../../api/NasFileAPI'

export default Vue.extend({
  name: 'resource-list',
  directives: { infiniteScroll },
  components: {
    ResourceListItem,
    ResourceHeader,
    OperateListAlter,
    DiskFile,
    MouseMenu
  },
  props: {
    dataSource: Array
  },
  watch: {
    dataSource() {
      this.currentArray = this.dataSource
    },
  },
  computed: {
    grid: function () {
      if (this.arrangeWay === ArrangeWay.horizontal) {
        return { gutter: 16, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, xxl: 24 }
      }
      return { gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }
    },
    isShowHeader: function () {
      if (this.arrangeWay === ArrangeWay.vertical) {
        return true
      }
      return false
    },
    alterStyle: function (): object {
      return {
        left: this.alterPosition.left,
        top: this.alterPosition.top
      }
    },
    NoTransType: function () {
      const myThis = this as any
			return myThis.DiskData.Type !== 'trans';
    },
  },
  data () {
    return {
			DiskData: {
				Type: 'disk', //头部分类标签,
				SelectFiles: [], //选择的文件
			},
			/*上传提示*/
      loading: false,
      busy: false,
      scrollHeight: 450,
      arrangeWay: ArrangeWay.horizontal,
      currentArray: this.dataSource,
      directoryList: this.dataSource,
      alterPosition: { left: '0px', top: '0px' },
			UserDiskData: [], //存放用户网盘数据
			loadClassify: 'normal', //网盘加载的分类
			LoadCompany: false, //是否加载完成
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
  mounted () {
    window.addEventListener('resize', this.observerWindowResize)
    this.observerEventBus()
    this.observerWindowResize()
  },
  destroyed () {
    window.removeEventListener('resize', this.observerWindowResize)
    EventBus.$off(EventType.backAction)
    EventBus.$off(EventType.categoryChangeAction)
    EventBus.$off(EventType.arrangeChangeAction)
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
			// localStorage.server = this.$Api.Public.severAddress();
			// this.$ipc.on('download', (e, file, completed) => {
			// 	completed && this.DiskFeatureControl('popup', file.name + '下载完成'); /*消息提醒*/
			// 	for (let i = 0; i < this.TransformData.length; i++) {
			// 		if (file.name === this.TransformData[i].name) {
			// 			this.$nextTick(() => {
			// 				for (let name in this.TransformData[i]) {
			// 					this.TransformData[i][name] = file[name];
			// 				}
			// 			});
			// 			return;
			// 		}
			// 	}
			// 	this.$nextTick(() => {
			// 		this.TransformData.push(file);
			// 	});
			// });
			// this.$ipc.on('win-data', (e, data) => {
			// 	//接收用户配置文件
			// 	localStorage.UserId = data.id;
			// 	this.$Api.User.Login(
			// 		data,
			// 		() => {
			// 			this.login = true;
			// 			this.GetMainFile(null, this.loadClassify);
			// 			this.$Api.LocalFile.read('transfer', data => {
			// 				if (data.length) {
			// 					this.TransformData = data;
			// 					this.TransformData.forEach(item => {
			// 						if (item.trans_type === 'download' && item.state !== 'completed') {
			// 							this.$electron.remote.getCurrentWindow().webContents.downloadURL(item.disk_main + '?disk_name=' + item.disk_name);
			// 						}
			// 					});
			// 				}
			// 			});
			// 			this.$Api.LocalFile.read('setting', data => {
			// 				this.ConfigObject = data;
			// 				this.$ipc.send('system', 'download-update', data.TransDownFolder);
			// 			});
			// 		},
			// 		() => {
			// 			this.$ipc.send('system', 'logoff');
			// 		}
			// 	);
			// });
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
      const alter: any = myThis.$refs.operateListAlter
      alter.showAlter()
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
			let fileArea = data.files;
			let params = {
				uuid: 'A252FB4252FB19AD',
				path: '/.ugreen_nas/6000/' + fileArea[0].name,	// 当前目录
				start: 0,
				end: fileArea[0].size-1,
				size: fileArea[0].size,
				action: 'f',
				api_token: 'YjkyMmZkZGQ1ZGE5Y2RmYTIyNGYxOTgzOWVlNDY0MTNjYjQ5YjdhMA=='
			}
			let body = selectUploadFiles[0];
			let input = {
				data: params,
				body: body,
				success: rs => {
					if (rs.code !== 200) {
						myThis.$message.warning((data.target ? data.target : data).files.length + '个文件已加入上传列队')
						return
					}
					myThis.UserDiskData.push(rs.data);
					console.log(rs);
				},
				error: rs => {
					myThis.$message.warning(rs.msg)
				}
			}
			NasFileAPI.upload(input).then()
		},
    alterBlur (el: any) {
      console.log('alter blur')
      console.log(el)
    },
    // 获取到菜单返回的结果
    DiskFeatureControl (commend: any, data: any, el: any) {
			console.log(commend);
      const myThis = this as any
      if (commend === 'copy' || commend === 'cut') {
        let tips = '';
        switch (commend) {
          case 'copy':
            tips = tips + '已复制到剪贴板'
            break
          case 'cut':
            tips = tips + '已剪切到剪贴板'
            break
        }
        myThis.$message.success(tips)
      }
      switch (commend) {
        case 'upload':
          break
        case 'download': //下载文件
          console.log(JSON.parse(JSON.stringify(myThis.DiskData)));
					console.log(myThis.SelectDownLoadFiles);
					if (myThis.SelectDownLoadFiles.length === 0) return
					let tips = myThis.SelectDownLoadFiles.length > 1 ? '所选' + myThis.SelectDownLoadFiles.length + '个项目' : myThis.SelectDownLoadFiles[0].disk_name;
					myThis.SelectDownLoadFiles.forEach(item => {
						console.log(item);
						// myThis.$electron.remote.getCurrentWindow().webContents.downloadURL(item.disk_main + '?disk_name=' + item.disk_name);
					});
					myThis.SelectDownLoadFiles = [];
					myThis.$Message.info(tips + '已加入下载列队');
          break
        default:
          break
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
      console.log('mousein');
			document.onmouseup = () => {
        console.log('mouseup');
        // 237
        // 339
				myThis.MouseSelectData = {
					left: 0,
					top: 0,
					width: 0,
					height: 0
				};
				document.onmousemove = null;
			};
			document.onmousemove = ev => {
        console.log('mousemove');
        console.log(ev.clientY);
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
				// myThis.ClearSelect();
				for (let i = 0; i < selList.length; i++) {
					let sl = selList[i].offsetWidth + selList[i].offsetLeft,
						st = selList[i].offsetHeight + selList[i].offsetTop;
					let area_l = area_data.left + area_data.width;
					let area_t = area_data.top + area_data.height;
					if (sl > area_data.left && st > area_data.top && selList[i].offsetLeft < area_l && selList[i].offsetTop < area_t) {
						if (myThis.UserDiskData[i].active === false) {
							myThis.UserDiskData[i].active = true;
						}
					} else {
						if (myThis.UserDiskData[i].active) {
							myThis.UserDiskData[i].active = false;
						}
					}
				}
			};
		},
  }
})
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
