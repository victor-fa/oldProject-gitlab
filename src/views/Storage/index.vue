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
import { StorageInfo, PartitionInfo, ArrangeWay, StorageType, ResourceItem } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import StorageHandler from './StorageHandler'
import { storageContextMenu } from '../../components/OperateListAlter/operateList'
import RouterUtility from '../../utils/RouterUtility'
import StringUtility from '../../utils/StringUtility'
import { SortList, SortKindItem } from '../../model/sortList'

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
      contentMenu: storageContextMenu, // item右键菜单选项
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
        this.dataArray = StorageHandler.formatStorages(storages)
        this.$store.dispatch('Resource/updateStorages', this.dataArray)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    singleClick (aIndex: number) {
      this.dataArray = this.dataArray.map((item, index) => {
        if (aIndex === index) {
          item.isSelected = item.isSelected !== true
        } else {
          item.isSelected = false
        }
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
        case 'unload':
          
          break;
        case 'fromat':
          
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
