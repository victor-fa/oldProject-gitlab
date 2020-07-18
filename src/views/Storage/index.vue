<template>
  <main-view
    ref="mainView"
    :listGrid="{ column: 2 }"
    :loading="loading"
    :dataSource="dataArray"
    :funcList="showFuncList"
    :contextItemMenu="itemMenu"
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
        <a-input :placeholder="commonInfo.placeholder" v-model="makesureModal.input" :max-length="6"/>
      </a-modal>
      <a-modal
        :visible="mode.visiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
        okText="确定" cancelText="取消" @ok="handleInitialize(null)" @cancel="mode.visiable = false;fetchStorages()">
        <p>请选择存储模式</p>
        <a-radio-group v-model="mode.choice">
          <a-radio :value="0">{{firstMode.title}}</a-radio>
          <a-radio :value="1">{{secondMode.title}}</a-radio>
        </a-radio-group>
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
import { StorageInfo, ResourceItem } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import StorageHandler from './StorageHandler'
import { storageContextMenu } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'
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
			diskFormatting: 0,
			finalMode: 0,
			firstMode,
			secondMode,
			commonInfo,
      itemMenu: _.clone(storageContextMenu), // item右键菜单选项
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
        if (_.get(response.data.data, 'formatting')) { this.$message.error('磁盘正在初始化'); return; }
        const storages = _.get(response.data.data, 'storages')
        this.diskMode = _.get(response.data.data, 'mode')
        this.diskFormatting = _.get(response.data.data, 'formatting')
        this.dataArray = StorageHandler.formatStorages(storages, this.diskMode)
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
      if (item.isNotInit) {
        this.$message.error('硬盘还未初始化')
        return
      }
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
      const storage = this.dataArray[index]
      const mainView: any = this.$refs.mainView
      const list = this.filterItemMenu(storage)
      mainView.showContextMenu(list, event)
    },
    filterItemMenu (storage: StorageInfo) {
      if (!storage.isNotInit) return this.itemMenu
      return this.itemMenu.map(group => {
        const items = group.items.map(item => {
          item.disable = item.command !== 'initialize'
          return item
        })
        group.items = items
        return group
      })
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
      if (this.diskFormatting !== 0) {	// 当前有磁盘任务
				this.$message.error('当前有磁盘任务，无法初始化')
				return
			}
      if (this.mode.visiable) {	// 已有弹框，选择后切换
				this.finalMode = this.mode.choice
				this.handleOperation()
				return
			}
      if (this.diskMode === -1) {	// 打开弹框【当用户不曾选过mode时，需要让用户选择模式再进行格式化】
        this.mode.visiable = true
				return
      }
      this.fetchStorages()  // 刷新列表，取消所有选中
			this.handleOperation()
    },
		handleOperation () {
      this.makesureModal = {
        title: this.finalMode === 0 ? this.firstMode.initialize.title : this.secondMode.initialize.title,
        visiable: true,
        input: '',
        message: this.finalMode === 0 ? this.firstMode.initialize.message : this.secondMode.initialize.message
      }
		},
		handleMakesure () {
			if (this.makesureModal.input.length === 0) {
				this.$message.error('您未输入关键信息！')
				return
			}
			if (this.makesureModal.input !== '确认删除数据') {
				this.$message.error('输入关键信息错误！')
				return
			}
			this.handleCancle()
			this.handleSwitchMode()
		},
		handleCancle () {
			this.makesureModal = {
				title: this.makesureModal.title,
				visiable: false,
				input: '',
				message: ``
      }
      this.fetchStorages()  // 刷新列表，取消所有选中
		},
		handleSwitchMode () {
			NasFileAPI.switchMode(this.finalMode, 0).then(response => {
				if (response.data.code !== 200) return
				this.mode = {
					visiable: false,
					choice: 0
        }
        this.fetchStorages()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
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
