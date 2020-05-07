<template>
  <div>
    <main-view
      ref="mainView"
      :loading="loading"
      :listGrid="{ gutter: 16, xs: 1, sm: 3, md: 4, lg: 6, xl: 8, xxl: 12 }"
      :currentPath="currentPath"
      :dataSource="dataArray"
      :funcList="customFuncList"
      :contextItemMenu="customContextMenu"
      :contextListMenu="customListContextMenu"
      v-on:headerCallbackActions="handleHeaderActions"
      v-on:listCallbackActions="handleListActions"
      v-on:itemCallbackActions="handleItemActions"
      v-on:contextMenuCallbackActions="handleContextMenuActions"
    >
    <template v-slot:resourceItem="{ item, index }">
      <div
        :key="index"
        class="custom-item"
        v-bind:class="{ 'custom-selected-item': item.isSelected }"
        @click.stop.exact="singleClick(index)"
        @dblclick.stop.exact="doubleClick(index)"
        @contextmenu.stop.exact="contextMenuClick($event, index)"
      >
        <img :src="item.myself_folder.image_path">
        <p class="custom-name">{{ item.myself_folder.name }}</p>
        <p class="custom-desc">{{ item.myself_folder.desc }}</p>
      </div>
    </template>
    </main-view>
    <new-custom-modal ref="newCustomMoal" v-on:creatCompleted="handleCreatedAction"/>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import axios from 'axios'
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import NewCustomModal from './NewCustomModal.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import { customFuncList } from '../MainView/ResourceFuncList'
import { CustomModule } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { customContextMenu, customListContextMenu } from '../../components/OperateListAlter/operateList'
import { nasServer } from '../../api/NasServer'
import { NasAccessInfo } from '../../api/ClientModel'

export default Vue.extend({
  name: 'custom',
  components: {
    MainView,
    NewCustomModal
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
      currentPath: '精选',
      dataArray: [] as CustomModule[],
      customFuncList,
      customContextMenu,
      customListContextMenu
    }
  },
  computed: {
    ...mapGetters('NasServer', ['accessInfo'])
  },
  mounted () {
    this.fetchCustomList()
  },
  methods: {
    fetchCustomList () {
      this.loading = true
      NasFileAPI.fetchCustomList().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'myself_folder_list') as CustomModule[]
        this.dataArray = list.map(item => {
          this.formatCustomItem(item)
          return item
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    formatCustomItem (item: CustomModule) {
      item.name = item.myself_folder.name
      const api_token = (this.accessInfo as NasAccessInfo).api_token
      const path = item.myself_folder.background_path
      if (path.length === 0) {
        item.myself_folder.image_path = require('../../assets/custom_placeholder.png')
        return
      }
      let image_path = nasServer.defaults.baseURL
      if (image_path === undefined) {
        item.myself_folder.image_path = require('../../assets/custom_placeholder.png')
        return
      }
      image_path += '/v1/file/http_download?'
      image_path += `uuid=${item.uuid}&path=${item.myself_folder.background_path}&api_token=${api_token}`
      item.myself_folder.image_path = image_path
    },
    showCustomModal (item?: CustomModule) {
      const modal = this.$refs.newCustomMoal as any
      modal.show(item)
    },
    handleCreatedAction () {
      this.fetchCustomList()
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
      const item = this.dataArray[index]
      this.pushResourceList(item)
    },
    pushResourceList (item: CustomModule) {
      const name = item.myself_folder.name
      this.$router.push({
        name: 'main-resource-view',
        query: { 
          path: item.path, 
          uuid: item.uuid
        },
        params: {
          showPath: `${this.currentPath}/${name}`
        }
      })
    },
    contextMenuClick (event: MouseEvent, index: number) {
      const mainView: any = this.$refs.mainView
      mainView.handleItemContextMenu(index, event)
    },
    // 覆盖混入中的方法
    handleRefreshAction () {
      this.fetchCustomList()
    },
    handleOpenAction () {
      const items = this.dataArray.filter(item => {
        return item.isSelected === true
      })
      if (_.isEmpty(items)) return
      const item = items[0]
      this.pushResourceList(item)
    },
    handleNewCustomAction () {
      console.log('newCustom')
      this.showCustomModal()
    },
    handleModifyAction () {
      const items = this.dataArray.filter(item => {
        return item.isSelected === true
      })
      const item = _.head(items)
      if (item === undefined) return
      this.showCustomModal(item)
    },
    handleDeletRequest (items: CustomModule[]) {
      items.forEach((item, index) => {
        item.disable = true
        NasFileAPI.deleteCustomFolder(item.path, item.uuid).then(response => {
          if (response.data.code !== 200) return
          this.dataArray.splice(index, 1)
        }).catch(error => {
          item.disable = false
          console.log(error)
        })
      })
    }
  }
})
interface PageConfig {
  path: string, 
  uuid: string
}
</script>

<style lang="less" scoped>
.custom-item {
  width: 132px;
  height: 107px;
  background-color: #f6f8fb;
  border-radius: 5px;
  img {
    margin: 5px;
    width: 122px;
    height: 69px;
    border-radius: 4px;
  }
  .custom-name {
    color: #353535;
    text-align: left;
    font-size: 10px;
    font-weight: bolder;
    margin: 0px 7px;
    line-height: 10px;
    margin-bottom: 0px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .custom-desc {
    color: #b3b6c5;
    font-size: 8px;
    line-height: 9px;
    font-weight: bold;
    margin: 4px 7px 0px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
}
.custom-selected-item {
  background-color: #def1ea;
}
</style>
