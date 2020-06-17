<template>
  <main-view
    ref="mainView"
    :listGrid="{ column: 2 }"
    :loading="loading"
    :dataSource="dataArray"
    :funcList="showFuncList"
    :contextItemMenu="contentMenu"
    v-on:headerCallbackActions="handleHeaderActions"
    v-on:listCallbackActions="handleListActions"
    v-on:itemCallbackActions="handleItemActions"
    v-on:contextMenuCallbackActions="handleContextMenuActions"
  >
    <template v-slot:resourceItem="{ item, index }">
      <storage-list-item
        :index="index"
        :model="item"
        :isSelected="item.isSelected" 
        @click.native.stop="singleClick(index)"
        @dblclick.native.stop="doubleClick(index)"
        @contextmenu.native.stop="contextMenuClick($event, index)"
      />
      <a-modal :title="makesureModal.title"
        :visible="makesureModal.visiable" :mask="false" :closable="false" :maskClosable="false" width="400px"
        :okText="commonInfo.okText" :cancelText="commonInfo.cancelText" @ok="handleMakesure"
        @cancel="handleCancle">
        <p>{{makesureModal.message}}</p>
        <font class="modal-font">{{commonInfo.tips}}</font>
        <a-input :placeholder="commonInfo.placeholder" v-model="makesureModal.input" :max-length="4"/>
      </a-modal>
    </template>
  </main-view>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import { storageFuncList } from '../MainView/ResourceFuncList'
import StorageListItem from './StorageListItem.vue'
import { StorageInfo, PartitionInfo, ArrangeWay, StorageType, ResourceItem } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import StorageHandler from './StorageHandler'
import { storageContextMenu, OperateGroup } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'
import StringUtility from '@/utils/StringUtility'
import { SortList, SortKindItem } from '@/model/sortList'
import processCenter, { EventName } from '@/utils/processCenter'
import { firstMode, secondMode, commonInfo } from '@/views/SystemSetting/settingModel'
import TransportHelper from '../../api/Transport/TransportHelper'

export default Vue.extend({
  name: 'storage',
  mixins: [MainViewMixin],
  components: {
    MainView,
    StorageListItem
  },
  data () {
    return {
      loading: false,
      dataArray: [] as StorageInfo[],
      mode: {
				visiable: false,
				choice: 0
      },
			diskMode: 0,
			finalMode: 0,
			firstMode,
			secondMode,
			commonInfo,
      contentMenu: _.clone(storageContextMenu), // item右键菜单选项
      showFuncList: _.clone(storageFuncList), // header中的操作功能集合
			makesureModal: {
				title: '',
				visiable: false,
				input: '',
				message: ''
			}
    }
  },
  mounted () {
    this.fetchStorages()
  },
  methods: {
    fetchStorages () {
      this.loading = true
      NasFileAPI.fetchStorages().then(response => {
        this.loading = false
        console.log(response)
        if (response.data.code !== 200) return
        const storages = _.get(response.data.data, 'storages')
        this.diskMode = _.get(response.data.data, 'mode')
        this.dataArray = StorageHandler.formatStorages(storages)
        this.$store.dispatch('Resource/updateStorages', this.dataArray)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    singleClick (index: number) {
      const item = this.dataArray[index] as StorageInfo
      if (item.isSelected === true) return
      this.dataArray = this.dataArray.map((item, aIndex) => {
        item.isSelected = aIndex === index
        return item
      })
    },
    doubleClick (index: number) {
      this.openSelectedItem(index)
    },
    // 打开选中的item
    openSelectedItem (index: number) {
      const item = this.dataArray[index]
      if (item.partitions.length > 1) {
        this.pushPartitionListPage(item)
      } else {
        const uuid = item.partitions[0].uuid
        const path = item.partitions[0].path
        this.pushResourceLitsPage(path, uuid, item.showName)
      }
    },
    // 跳转分区列表界面
    pushPartitionListPage (item: StorageInfo) {
      item.isSelected = true
      RouterUtility.push(item.showName, 'storage-partitions')
    },
    // 跳转资源列表界面
    pushResourceLitsPage (path: string, uuid: string, name: string) {
      RouterUtility.push(name, 'main-resource-view', { path, uuid })
    },
    contextMenuClick (event: MouseEvent, index: number) {
      const mainView: any = this.$refs.mainView
      mainView.handleItemContextMenu(index, event)
    },
    handleContextMenuActions (command: string, ...args: any[]) {
      console.log(command)
      const _this = this as any
      switch (command) {
        case 'open': 
          this.handleOpenAction()
          break;
        case 'rename':
          // TODO: 磁盘重命名
          break;
        case 'initialize':
          this.handleInitialize()
          break;
        case 'info':
          this.handleReadInfo()
          break;
        default:
          break;
      }
    },
    handleOpenAction () {
      const index = StorageHandler.getFristSelectedIndex(this.dataArray)
      if (index === null) return
      this.openSelectedItem(index)
    },
    handleReadInfo () {
      const _this = this as any
      const index = StorageHandler.getFristSelectedIndex(this.dataArray)
      if (index === null) return
      _this.$ipc.send('file-control', 0, this.dataArray[index]);
    },
    handleInitialize () {
			if (this.mode.visiable) {	// 已有弹框，选择后切换
				// this.handleOperation('detail', this.mode.choice)
				this.finalMode = this.mode.choice
				this.handleOperation('makesure')
				return
			}
      if (this.diskMode === -1) {	// 打开弹框
				this.mode.visiable = true
				return
			}
      const index = StorageHandler.getFristSelectedIndex(this.dataArray)
      if (index === null) return
      const item = this.dataArray[index] as any
      console.log(JSON.parse(JSON.stringify(item)));
			// this.handleOperation('detail', item.raidMode)	// 按原先的默认模式处理
			this.finalMode = item.raidMode
			this.handleOperation('makesure')
    },
		handleOperation (flag) {
			if (flag === 'makesure') {
				this.makesureModal = {
					title: this.finalMode === 0 ? this.firstMode.makesure.title : this.secondMode.makesure.title,
					visiable: true,
					input: '',
					message: this.finalMode === 0 ? this.firstMode.makesure.message : this.secondMode.makesure.message
				}
			} else if (flag === 'switchMode') {
				this.makesureModal = {
					title: this.finalMode === 0 ? this.firstMode.switchMode.title : this.secondMode.switchMode.title,
					visiable: true,
					input: '',
					message: this.finalMode === 0 ? this.firstMode.switchMode.message : this.secondMode.switchMode.message
				}
			}
		},
		handleMakesure () {
			if (this.makesureModal.input.length === 0) {
				this.$message.error('您未输入关键信息！')
				return
			}
			if (this.makesureModal.input !== '我已了解') {
				this.$message.error('输入关键信息错误！')
				return
			}
			this.handleCancle()
			this.makesureModal.title === '硬盘初始化' ? this.handleSwitchMode() : this.handleOperation('switchMode')
		},
		handleCancle () {
			this.makesureModal = {
				title: this.makesureModal.title,
				visiable: false,
				input: '',
				message: ``
			}
		},
		handleSwitchMode () {
			NasFileAPI.switchMode(this.finalMode, 1).then(response => {
				if (response.data.code !== 200) return
				this.mode = {
					visiable: false,
					choice: 0
				}
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		switchDevice () {
			this.$store.dispatch('NasServer/clearCacheNas')
			TransportHelper.clearQueueCache()
			processCenter.renderSend(EventName.bindList)
		},
    // 重写父类中的方法
    handleRefreshAction () {
      console.log('refresh')
      this.fetchStorages()
    }
  }
})
</script>

<style lang="less" scoped>
.modal-font {
	color: #f00;
	display: block;
	margin-bottom: 15px;
}
</style>
