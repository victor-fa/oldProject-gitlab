<template>
  <div>
    <resource-header v-if="isShowHeader"/>
    <div class="cd-upload-tips" v-show="ShowUploadTips">松开鼠标开始上传文件</div>
    <!-- v-show="ShowUploadTips && DiskData.Type === 'disk' && loadClassify === 'normal'" -->
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
import { ArrangeWay, ResourceType, ResourceItem } from './resourceModel'
import { CategoryType } from '../../components/BasicHeader/Model/categoryList'
import ResourceListItem from './ResourceListItem.vue'
import ResourceHeader from './resourceHeader.vue'
import OperateListAlter from '../OperateListAlter/index.vue'
import upload from '../../utils/file/upload';

export default Vue.extend({
  name: 'resource-list',
  directives: { infiniteScroll },
  components: {
    ResourceListItem,
    ResourceHeader,
    OperateListAlter
  },
  props: {
    dataSource: Array
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
    }
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
			// UserDiskData: [], //存放用户网盘数据
			/*上传提示*/
			ShowUploadTips: false,
			loadClassify: 'normal', //网盘加载的分类
      loading: false,
      busy: false,
      scrollHeight: 450,
      arrangeWay: ArrangeWay.horizontal,
      currentArray: this.dataSource,
      directoryList: this.dataSource,
      alterPosition: { left: '0px', top: '0px' }
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
    observerWindowResize () {
      const newHeight = document.body.clientHeight - 128
      if (newHeight !== this.scrollHeight) {
        this.scrollHeight = newHeight
      }
    },
    observerEventBus () {
      EventBus.$on(EventType.backAction, () => {
        // TODO: 在有多级目录时，这里应该设置一个数据栈
        this.currentArray = this.dataSource
        this.directoryList = this.currentArray
        this.$store.dispatch('Resource/popPath')
      })
      EventBus.$on(EventType.categoryChangeAction, (type: CategoryType) => {
        this.currentArray = this.filterCurrentArray(type)
      })
      EventBus.$on(EventType.arrangeChangeAction, (way: ArrangeWay) => {
        this.arrangeWay = way
      })
    },
    filterCurrentArray (type: CategoryType) {
      let newArray: Array<ResourceItem> = []
      for (let index = 0; index < this.directoryList.length; index++) {
        const element = this.directoryList[index] as ResourceItem
        if (this.isInclude(type, element.type)) {
          newArray.push(element)
        }
      }
      return newArray
    },
    isInclude (ctype: CategoryType, rtype: ResourceType) {
      switch (ctype) {
        case CategoryType.all:
          return true
        case CategoryType.image:
          if (rtype === ResourceType.image) {
            return true
          }
          break
        case CategoryType.video:
          if (rtype === ResourceType.video) {
            return true
          }
          break
        case CategoryType.audio:
          if (rtype === ResourceType.audio) {
            return true
          }
          break
        case CategoryType.document:
          if (rtype !== ResourceType.image && rtype !== ResourceType.video && rtype !== ResourceType.audio && rtype !== ResourceType.folder) {
            return true
          }
          break
      }
      return false
    },
    handleInfiniteOnLoad () {
      console.log('load more data')
      // EventBus.$emit(EventType.categoryChangeAction, item.type)
    },
    didSelectItem (item: ResourceItem) {
      switch (item.type) {
        case ResourceType.folder:
          this.openFolder(item)
          break
        default:
          break
      }
    },
    openFolder (item: ResourceItem) {
      // reload data
      this.currentArray = item.subResources !== undefined ? item.subResources : []
      this.directoryList = this.currentArray
      // change path
      this.$store.dispatch('Resource/pushPath', item.name)
    },
    didOperatItem (event: MouseEvent, item: ResourceItem) {
      event.preventDefault()
      const alter: any = this.$refs.operateListAlter
      alter.showAlter()
      this.alterPosition = this.calculateSafePosition(event.clientX, event.clientY)
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
			if (this.loadClassify === 'normal') {
				this.PrepareUploadFile(e.dataTransfer);
				this.ShowUploadTips = false;
			}
		},
		PrepareUploadFile(data: any) {
			upload.prepareFile(data, {
				data: '123',
				add: (file: any) => {
          console.log(file);
					// this.TransformData.push(file);
					// this.$message.info((data.target ? data.target : data).files.length + '个文件已加入上传列队');
				},
				success: (file: any, rs: any) => {
          console.log(file + rs);
					// if (this.NowDiskID === rs.data.parent_id) {
					// 	this.UserDiskData.push(rs.data);
					// }
					this.DiskFeatureControl('popup', file.name + '上传完成'); /*消息提醒*/
				}
			});
		},
    alterBlur (el: any) {
      console.log('alter blur')
      console.log(el)
    },
    // 获取到菜单返回的结果
    DiskFeatureControl (commend: any, data: any) {
      if (commend === 'copy' || commend === 'cut') {
        let tips = '';
        console.log();
        console.log(123123);
        switch (commend) {
          case 'copy':
            tips = tips + '已复制到剪贴板'
            break
          case 'cut':
            tips = tips + '已剪切到剪贴板'
            break
        }
        // this.$message.info(tips)
      }
      switch (commend) {
        case 'upload':
          break
        // case 'download': //下载文件
          // this.$Message.info(tips + '已加入下载列队');
          // break
        default:
          break
      }
    }
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
</style>

<style>
.resource-list .ant-list-header {
  padding: 0px;
}
.resource-list .ant-list-item {
  margin: 0px;
}
</style>
