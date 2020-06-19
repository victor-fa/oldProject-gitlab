<template>
  <div class="custom">
    <main-view
      ref="mainView"
      :loading="loading"
      :listGrid="{ gutter: 16, xs: 1, sm: 3, md: 4, lg: 6, xl: 8, xxl: 12 }"
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
      <custom-list-item
        :index="index"
        :isSelected="item.isSelected"
        :model="item"
        @click.stop.native="singleClick(index)"
        @dblclick.stop.native="doubleClick(index)"
        @contextmenu.stop.native="contextMenuClick($event, index)"
      />
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
import CustomListItem from './CustomListItem.vue'
import NewCustomModal from './NewCustomModal.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import { customFuncList } from '../MainView/ResourceFuncList'
import { CustomModule } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import { customContextMenu, customListContextMenu } from '@/components/OperateListAlter/operateList'
import { nasServer } from '@/api/NasServer'
import { NasAccessInfo } from '@/api/ClientModel'
import CustomHandler from './CustomHandler'
import RouterUtility from '@/utils/RouterUtility'

export default Vue.extend({
  name: 'custom',
  components: {
    MainView,
    NewCustomModal,
    CustomListItem
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
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
        const api_token = (this.accessInfo as NasAccessInfo).api_token
        this.dataArray = list.map(item => {
          const newItem = CustomHandler.formatItem(item, api_token)
          return newItem
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
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
      const name = item.name
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(name, 'main-resource-view', { path, uuid })
    },
    contextMenuClick (event: MouseEvent, index: number) {
      const mainView: any = this.$refs.mainView
      mainView.handleItemContextMenu(index, event)
    },
    // 覆盖混入中的方法
    handleRefreshAction () {
      this.fetchCustomList()
    },
    handleNewCustomAction () {
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
.custom {
  height: 100%;
}
</style>
