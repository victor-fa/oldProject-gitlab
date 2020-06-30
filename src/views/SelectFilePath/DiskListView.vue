<template>
  <a-spin :spinning="loading">
    <div class="first-directory">
      <span v-show="showDisk" class="separator-tip">磁盘</span>
      <storage-list-item
        v-for="(item, index) in showStorages"
        :key="index"
        id="disk-item"
        :model="item"
        :isSelected="item.isSelected"
        @click.native.stop="diskClick(index)"
        @dblclick.native.stop="diskDoubleClick(index)"
        @contextmenu.native.stop.prevent="diskContextMenu(index)"
      />
      <span v-if="showCustom" class="separator-tip">珍藏</span>
      <div v-if="showCustom" class="book-item">
        <custom-list-item
          v-for="(item, index) in showCustoms"
          :key="index"
          id="custom-list-item"
          :index="index"
          :model="item"
          :isSelected="item.isSelected"
          @click.native.stop="customClick(index)"
          @dblclick.native.stop="customDoubleClick(index)"
          @contextmenu.native.stop.prevent="customContextMenu(index)"
        />
      </div>
    </div>
  </a-spin>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import StorageListItem from '@/views/Storage/StorageListItem.vue'
import CustomListItem from '@/views/Custom/CustomListItem.vue' 
import { StorageInfo, CustomModule, PartitionInfo, ResourceItem } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import StorageHandler from '../Storage/StorageHandler'
import CustomHandler from '../Custom/CustomHandler'
import { NasAccessInfo } from '../../api/ClientModel'
import FileModalHandler, { CacheParams, CacheType } from './FileModalHandler'

export default Vue.extend({
  name: 'first-directory',
  components: {
    StorageListItem,
    CustomListItem
  },
  props: {
    cacheParams: Object,
    selectedItem: Object
  },
  data () {
    return {
      loading: false,
      storages: [] as StorageInfo[],
      customs: [] as CustomModule[],
      showStorages: [] as Array<StorageInfo | PartitionInfo>,
      showCustoms: [] as CustomModule[],
      selectedCell: undefined as StorageInfo | PartitionInfo | CustomModule | undefined
    }
  },
  computed: {
    ...mapGetters('NasServer', ['accessInfo']),
    showDisk: function () {
      const count = this.showStorages.length as number
      return count > 0
    },
    showCustom: function () {
      const count = this.showCustoms.length as number
      return count > 0
    }
  },
  watch: {
    cacheParams: function (newValue: CacheParams) {
      this.fetchData(newValue)
    }
  },
  mounted () {
    this.fetchData()
  },
  methods: {
    diskClick (index: number) {
      const item = this.storages[index]
      this.selectedCell = item
      this.$emit('didSelectItem', item)
      this.showStorages = FileModalHandler.setItemSelected(this.showStorages, index)
      this.showCustoms = FileModalHandler.resetItemSelected(this.showCustoms)
    },
    diskDoubleClick (index: number) {
      const item = this.showStorages[index]
      this.handleOpenAction(item)
    },
    diskContextMenu (index: number) {
      this.diskClick(index)
      this.showContextMenu()
    },
    customClick (index: number) {
      const item = this.showCustoms[index]
      this.selectedCell = item
      this.$emit('didSelectItem', item)
      this.showCustoms = FileModalHandler.setItemSelected(this.showCustoms, index)
      this.showStorages = FileModalHandler.resetItemSelected(this.showStorages)
    },
    customDoubleClick (index: number) {
      const item = this.showCustoms[index]
      this.handleOpenAction(item)
    },
    customContextMenu (index: number) {
      this.customClick(index)
      this.showContextMenu()
    },
    handleMenuItemClick () {
      if (this.selectedCell === undefined) return
      this.handleOpenAction(this.selectedCell)
    },
    fetchData (params?: CacheParams) {
      const cache: CacheParams = params === undefined ? this.cacheParams : params
      if (cache.type === CacheType.disk) {
        this.fetchStorages()
        this.fetchCustomList()
      } else if (cache.type === CacheType.partition) {
        const name = cache.name
        this.fetchPartitions(name)
      }
    },
    fetchStorages () {
      this.loading = true
      NasFileAPI.fetchStorages().then(response => {
        this.loading = false
        console.log(response)
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'storages')
        this.storages = StorageHandler.formatStorages(list)
        this.showStorages = StorageHandler.formatShowStorages(this.storages, this.selectedItem)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    fetchPartitions (name: string) {
      let partitions: PartitionInfo[] = []
      for (let index = 0; index < this.storages.length; index++) {
        const storage = this.storages[index]
        if (storage.name !== name) {
          partitions = storage.partitions
          this.showCustoms = []
          break
        }
      }
      const selectedCell = this.selectedItem as undefined | PartitionInfo
      if (selectedCell !== undefined && selectedCell.custom === 'partition') {
        const name = (selectedCell as PartitionInfo).showName
        partitions = partitions.map(item => {
          item.isSelected = item.showName === name
          return item
        })
      }
      this.showStorages = partitions
      this.showCustoms = []
    },
    fetchCustomList () {
      this.loading = true
      NasFileAPI.fetchCustomList().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'myself_folder_list') as CustomModule[]
        const api_token = (this.accessInfo as NasAccessInfo).api_token
        this.customs = list.map(item => {
          const newItem = CustomHandler.formatItem(item, api_token)
          return newItem
        })
        this.showCustoms = CustomHandler.formatShowItems(this.customs, this.selectedItem)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    showContextMenu () {
      const { BrowserWindow } = require('electron').remote
      const currentWindow = BrowserWindow.getFocusedWindow()
      if (currentWindow !== null) {
        const { Menu, MenuItem } = require('electron').remote
        const menu = new Menu()
        menu.append(new MenuItem({ label: '打开', click: this.handleMenuItemClick }))
        menu.popup({ window: currentWindow })
      }
    },
    handleOpenAction (item: StorageInfo | PartitionInfo | CustomModule) {
      const params = FileModalHandler.generateCacheParams(item)
      if (params === undefined) return
      this.$emit('open', params, item)
    }
  }
})
</script>

<style lang="less" scoped>
.first-directory {
  height: 259px;
  overflow: scroll;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  .separator-tip {
    color: #484848;
    font-size: 14px;
    text-align: left;
    padding-left: 13px;
    padding-top: 4px;
  }
  #disk-item {
    width: auto;
    border-radius: 8px;
    margin: 4px 10px 2px;
    justify-content: flex-start;
    cursor: default;
  }
  .book-item {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-left: 10px;
    #custom-list-item {
      background-color: white;
      margin: 4px 3px;
      border-radius: 6px;
    }
  }
}
</style>
