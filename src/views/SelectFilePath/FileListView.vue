<template>
  <a-spin :spinning="loading">
    <basic-list
      :busy="busy"
      :dataSource="dataArray"
      class="content-list"
      v-on:loadMoreData="handleLoadMoreAction"
    >
      <template v-slot:renderItem="{ item, index }">
        <div
          class="content-list-item"
          v-bind:class="{
            'content-list-item-odd': index % 2,
            'content-list-item-selected': item.isSelected
          }"
          @click.stop="singleClick(index)"
          @dblclick.stop="doubleClick(index)"
          @contextmenu.stop.prevent="contextmenu(index)"
        >
          <img src="../../assets/resource/folder_icon.png">
          <a-input
            v-if="item.renaming === true"
            v-focus
            ref="inputName"
            v-model="newName"
            placeholder="请输入文件名"
            @focus="handleFocus($event)"
            @blur="handleBlur($event, index)"
            @keydown.enter="handlePressEnter($event)"
          />
          <span v-else>{{ item.name }}</span>
        </div>
      </template>
    </basic-list>
  </a-spin>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import BasicList from '@/components/BasicList/index.vue'
import { ResourceItem, StorageInfo, PartitionInfo, CustomModule, ResourceType } from '@/api/NasFileModel'
import ResourceHandler from '../MainView/ResourceHandler'
import NasFileAPI from '../../api/NasFileAPI'
import { CacheParams, CacheType } from './FileModalHandler'
import { BasicResponse } from '../../api/UserModel'

export default Vue.extend({
  name: 'second-directory',
  directives: {
    focus: {
      inserted: function (el) {
        el.focus()
      }
    }
  },
  components: {
    BasicList
  },
  props: {
    cacheParams: {
      type: Object,
      required: true
    },
    selectedItem: Object
  },
  data () {
    return {
      page: 1,
      busy: false,
      loading: false,
      newName: '',
      dataArray: [] as ResourceItem[],
      selectedCell: undefined as undefined | ResourceItem
    }
  },
  watch: {
    cacheParams: function (newValue: CacheParams) {
      this.fetchResourceList(newValue)
    }
  },
  created () {
    this.fetchResourceList()
  },
  methods: {
    // action methods
    handleLoadMoreAction () {
      this.page++
      this.fetchResourceList()
    },
    singleClick (index: number) {
      this.dataArray = this.dataArray.map((item, aIndex) => {
        item.isSelected = index === aIndex
        return item
      })
      const item = this.dataArray[index]
      this.selectedCell = item
      this.$emit('didSelectItem', item)
    },
    doubleClick (index: number) {
      const item = this.dataArray[index]
      this.openSpecifiedFolder(item)
    },
    contextmenu (index: number) {
      this.singleClick(index)
      const { BrowserWindow } = require('electron').remote
      const currentWindow = BrowserWindow.getFocusedWindow()
      if (currentWindow !== null) {
        const { Menu, MenuItem } = require('electron').remote
        const menu = new Menu()
        menu.append(new MenuItem({ label: '打开', click: this.handleMenuItemClick }))
        menu.popup({ window: currentWindow })
      }
    },
    handleMenuItemClick () {
      if (this.selectedCell === undefined) return
      this.openSpecifiedFolder(this.selectedCell)
    },
    handleFocus (event: MouseEvent) {
      const target = event.currentTarget as HTMLInputElement
      target.select()
    },
    handleBlur (event: MouseEvent, index: number) {
      if (_.isEmpty(this.newName)) {
        this.dataArray.shift()
        return
      }
      if (!ResourceHandler.checkFileName(this.newName)) {
        this.$message.error('名称包含非法字符')
        return
      }
      this.handleNewFolderRequest(this.newName)
    },
    handlePressEnter (event: MouseEvent) {
      event.stopPropagation()
      event.preventDefault()
      const input = (this.$refs.inputName as Vue).$el as HTMLInputElement
      input.blur()
    },
    handleNewFolderRequest (newName: string) {
      this.loading = true
      const result = this.parseCacheParams()
      NasFileAPI.newFolder(`${result.path}/${newName}`, result.uuid).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.fetchResourceList()
      }).catch(error => {
        console.log(error)
        this.$message.error('文件夹创建失败')
      })
    },
    // public methods
    newFolder () {
      const newName = ResourceHandler.calculateNewFolderName(this.dataArray)
      const newItem = {
        type: ResourceType.folder,
        name: newName,
        isSelected: true,
        renaming: true
      } as ResourceItem
      this.dataArray.unshift(newItem)
    },
    // private methods
    fetchResourceList (params?: CacheParams) {
      this.loading = true
      const result = this.parseCacheParams(params)
      NasFileAPI.fetchResourceList(result.path, result.uuid, this.page).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    parseCacheParams (params?: CacheParams) {
      const cache: CacheParams = params === undefined ? this.cacheParams : params
      const path = cache.path!
      const uuid = cache.uuid!
      return { path, uuid }
    },
    parseResponse (data: BasicResponse) {
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < 40) this.busy = true
      list = list.filter(item => {
        if (item.type !== ResourceType.folder) {
          this.busy = true
          return false
        }
        return true
      })
      list = ResourceHandler.formatResourceList(list)
      list = this.updateselectedCell(list)
      list = this.page === 1 ? list : this.dataArray.concat(list)
      this.dataArray = list.map((item, index) => {
        item.index = index
        return item
      })
    },
    // 根据params更新list中选中的item
    updateselectedCell (list: ResourceItem[]) {
      const item = this.selectedItem as ResourceItem
      if (item === undefined || item.custom !== 'resource') return list
      const path = (item as ResourceItem).path
      return list.map(item => {
        item.isSelected = item.path === path
        return item
      })
    },
    // 打开指定的文件夹
    openSpecifiedFolder (item: ResourceItem) {
      const cache: CacheParams = {
        name: item.name,
        type: CacheType.resource,
        path: item.path,
        uuid: item.uuid
      }
      this.$emit('open', cache, item)
    }
  }
})
</script>

<style lang="less" scoped>
.content-list {
  height: 259px !important;
  .content-list-item {
    width: 100%;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background-color: white;
    img {
      width: 20px;
      height: 17px;
      margin-left: 14px;
    }
    span {
      color: #484848;
      font-size: 12px;
      margin-left: 9px;
    }
    input {
      height: 18px;
      width: 100px;
      color: #484848;
      font-size: 12px;
      margin-left: 9px;
      padding: 2px 4px;
    }
  }
  .content-list-item-odd {
    background-color: #f6f8fb;
  }
  .content-list-item-selected {
    background-color: #def1ea;
  }
}
</style>
