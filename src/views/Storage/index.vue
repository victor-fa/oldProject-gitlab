<template>
  <main-view
    ref="mainView"
    :currentPath="currentPath"
    :listGrid="{ column: 2 }"
    :loading="loading"
    :dataSource="dataArray"
    :contextItemMenu="contentMenu"
    v-on:listCallbackActions="handleListActions"
    v-on:contextMenuCallbackActions="handleContextMenuActions"
  >
    <template v-slot:header="{ directory, popoverList }">
      <main-header-view
        :directory="currentPath"
        :popoverList="popoverList"
        v-on:CallbackAction="handleHeaderViewAction"
      />
    </template>
    <template v-slot:resourceItem="{ item, index }">
      <storage-list-item
        :storageModel="item"
        :isSelected="item.isSelected" 
        @click.native.stop.exact="singleClick(index)"
        @dblclick.native.stop.exact="doubleClick(index)"
        @contextmenu.native.stop.exact="contextMenuClick($event, index)"
      />
    </template>
  </main-view>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import MainHeaderView from '../MainView/MainHeaderView.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import StorageListItem from './StorageListItem.vue'
import { StorageInfo, PartitionInfo, ArrangeWay, StorageType, ResourceItem } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import StorageHandler from './StorageHandler'
import { storageContextMenu } from '../../components/OperateListAlter/operateList'
import { CategoryType } from '../../model/categoryList'
import { User } from '../../api/UserModel'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'storage',
  mixins: [MainViewMixin],
  components: {
    MainView,
    MainHeaderView,
    StorageListItem
  },
  data () {
    return {
      loading: false,
      dataArray: [] as StorageInfo[],
      currentPath: '存储', // 当前页路径 
      contentMenu: storageContextMenu // item右键菜单选项
    }
  },
  computed: {
    ...mapGetters('User', ['user'])
  },
  mounted () {
    const json = this.$route.params.selectedItem
    if (_.isEmpty(json)) {
      this.fetchStorages()
    } else { 
      const item = JSON.parse(json) as ResourceItem
      this.pushAssignResourceListPage(item)
    }
  },
  methods: {
    fetchStorages () {
      this.loading = true
      NasFileAPI.fetchStorages().then(response => {
        this.loading = false
        console.log(response)
        if (response.data.code !== 200) return
        const storages = _.get(response.data.data, 'storages')
        this.dataArray = this.formatStorages(storages)
        this.$store.dispatch('Resource/updateStorages', this.dataArray)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    formatStorages (storags: StorageInfo[]) {
      const internalTypes = [StorageType.internal, StorageType.internal_SSD, StorageType.internal_HDD]
      return storags.map(item => {
        item.showName = StorageHandler.matchStorageName(item.type)
        item.showIcon = StorageHandler.matchStorageIcon(item.type)
        item.showSize = StorageHandler.matchStorageSize(item.used, item.size)
        item.showProgress = (item.used / item.size) * 100
        item.isInternal = internalTypes.indexOf(item.type) !== -1
        item.partitions.forEach((partition, index) => {
          partition.showName = `分区${index + 1}`
          partition.showIcon = item.showIcon
          partition.showSize = StorageHandler.matchStorageSize(partition.used, partition.size)
          partition.showProgress = (partition.used / partition.size) * 100
          partition.isInternal = item.isInternal
        })
        return item
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
        const no = (this.user as User).ugreenNo
        const path = item.isInternal ? `/.ugreen_nas/${no}` : `/`
        this.pushResourceLitsPage(path, uuid, item.showName)
      }
    },
    // 跳转分区列表界面
    pushPartitionListPage (item: StorageInfo) {
      item.isSelected = true
      this.$router.push({
        name: 'storage-partitions',
        query: { showPath: `${this.currentPath}/${item.showName}` }
      })
    },
    // 跳转资源列表界面
    pushResourceLitsPage (path: string, uuid: string, name: string) {
      this.$router.push({
        name: 'main-resource-view',
        query: { path, uuid },
        params: {
          showPath: `${this.currentPath}/${name}`
        }
      })
    },
    // 跳转到指定位置的文件列表页(用于跳转到文件指定位置)
    pushAssignResourceListPage (item: ResourceItem) {
      const path = StringUtility.pathDirectory(item.path)
      const uuid = item.uuid
      const ugreenNo = (this.user as User).ugreenNo
      const internalPrefix = `/.ugreen_nas/${ugreenNo}/`
      const extendPrefix = `/${(ugreenNo)}/`
      const isInternal = path.indexOf(internalPrefix) !== -1
      const start = isInternal ? internalPrefix.length : extendPrefix.length
      let showPath = isInternal ? `${this.currentPath}/内置硬盘` : `${this.currentPath}/扩展硬盘`
      if (start < path.length) showPath += `/${path.substring(start, path.length)}`
      this.$router.push({
        name: 'main-resource-view',
        query: { path, uuid },
        params: {
          showPath,
          selectedPath: item.path
        }
      })
    },
    contextMenuClick (event: MouseEvent, index: number) {
      const mainView: any = this.$refs.mainView
      mainView.handleItemContextMenu(index, event)
    },
     handleHeaderViewAction (action: string, ...args: any[]) {
       switch (action) {
         case 'back':
           this.$router.go(-1)
           break;
         case 'refresh':
           this.fetchStorages()
           break;
         default:
           break;
       }
     },
    handleContextMenuActions (command: string, ...args: any[]) {
      console.log(command)
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
          
          break;
        default:
          break;
      }
    },
    handleOpenAction () {
      const index = StorageHandler.getFristSelectedIndex(this.dataArray)
      if (index === null) return
      this.openSelectedItem(index)
    }
  }
})
</script>

<style lang="less" scoped>

</style>
