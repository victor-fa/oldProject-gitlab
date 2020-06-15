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
      <a-modal
        :visible="mode.visiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
        okText="确定" cancelText="取消" @ok="handleInitialize(null)" @cancel="mode.visiable = false;mode.choice = 0">
        <p>请选择存储模式</p>
        <a-radio-group v-model="mode.choice">
          <a-radio :value="0">双盘备份模式</a-radio>
          <a-radio :value="1">普通存储模式</a-radio>
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
import { StorageInfo, PartitionInfo, ArrangeWay, StorageType, ResourceItem } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import StorageHandler from './StorageHandler'
import { storageContextMenu, OperateGroup } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'
import StringUtility from '@/utils/StringUtility'
import { SortList, SortKindItem } from '@/model/sortList'
import { clearQueueCache } from '@/api/Transport/TransportQueue'
import processCenter, { EventName } from '@/utils/processCenter'

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
      contentMenu: _.clone(storageContextMenu), // item右键菜单选项
      showFuncList: _.clone(storageFuncList) // header中的操作功能集合
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
				this.handleOperation('detail', this.mode.choice)
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
			this.handleOperation('detail', item.raidMode)	// 按原先的默认模式处理
    },
		handleOperation (flag, data) {
			const { dialog } = require('electron').remote
			let message = ''
			if (flag === 'detail') {
				message = data === 0 ? `双盘备份模式是将两个硬盘互作备份，即双盘raid1模式，
								单个硬盘损坏不影响数据的读取，把坏的硬盘换掉后可继
								续恢复双盘备份功能。组合之后，总容量等于2块硬盘中
								较小的容量。` : `普通硬盘存储模式，没有相互备份数据功能，如有硬盘损
								坏，那坏掉的硬盘的数据将无法读取。`
			} else if (flag === 'second') {
				message = data === 0 ? `当前接入内置硬盘口的硬盘数据将会被格式化，并将两
								个硬盘组合成双盘备份模式。
								（操作开始后将不能中止）` : `当前接入内置硬盘口的硬盘数据将会被格式化，并将两个
								硬盘设置成普通硬盘模式，两块硬盘单独使用，没有备份功能。
								（操作开始后将不能中止）`
			} else if (flag === 'switchMode') {
				message = data === 0 ? `当前存储模式是：双盘备份模式
								此操作将把（盘位2）进行磁盘格式化，然后自动同步盘位1
								的数据，恢复当前双盘备份功能。
								（操作开始后将不能中止）` : `当前存储模式是：普通存储模式
								此操作将把（盘位2）进行磁盘格式化，请确认备份好硬盘的
								数据再进行操作。
								（操作开始后将不能中止）`
			}
			dialog.showMessageBox({
				type: 'info', message, buttons: ['确定', '取消'], cancelId: 1
			}).then(result => {
				if (result.response === 0) {
					if (flag === 'detail') {
						this.handleOperation('second', data)
					} else if (flag === 'second') {
						this.handleOperation('switchMode', data)
					} else if (flag === 'switchMode') {
						this.switchMode(data)
					}
				}
			}).catch(error => console.log(error))
		},
		switchMode(mode) {
			NasFileAPI.switchMode(mode, 0).then(response => {
				if (response.data.code !== 200) { this.$message.error('网络连接错误，请检测网络') }
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
			clearQueueCache()
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

</style>
