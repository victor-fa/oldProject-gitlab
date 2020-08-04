<template>
  <div>
    <main-view
      :busy="busy"
      :count="totalSize"
      :loading="loading"
      :adjust="123"
      :showToolbars="[]"
      :dataSource="dataArray"
      :funcList="showFuncList"
      :contextItemMenu="itemMenu"
      :contextListMenu="listMenu"
      v-on:headerCallbackActions="handleHeaderActions"
      v-on:listCallbackActions="handleListActions"
      v-on:itemCallbackActions="handleItemActions"
      v-on:contextMenuCallbackActions="handleContextMenuActions"
    />
    <basic-model
      :title="basicModel.title"
      :content="basicModel.content"
      :loading="basicModel.loading"
      :type="basicModel.type"
      :rightButton="basicModel.rightButton"
      :data="basicModel.data"
      v-if="basicModel.visiable"
      v-on:dismiss="basicModel.visiable = false"
      v-on:confirm="handleBasicConfirm"/>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import { ResourceItem, OrderType } from '@/api/NasFileModel'
import NasFileAPI, { maxSize } from '@/api/NasFileAPI'
import ResourceHandler from '../MainView/ResourceHandler'
import { recycleContextMenu, recycleListContextMenu } from '@/components/OperateListAlter/operateList'
import RouterUtility from '@/utils/RouterUtility'
import { BasicResponse } from '../../api/UserModel'
import { recycleFuncList } from '../MainView/ResourceFuncList'
import BasicModel from '@/components/BasicModel/index.vue'

export default Vue.extend({
  name: 'recycle',
  components: {
    MainView,
    BasicModel
  },
  mixins: [MainViewMixin],
  data () {
    return {
      page: 1,
      totalSize: 0,
      busy: false,
      loading: false,
      order: OrderType.byNameDesc, // 提供给子类使用
      dataArray: [] as ResourceItem[],
      itemMenu: recycleContextMenu,
      listMenu: recycleListContextMenu,
      showFuncList: _.cloneDeep(recycleFuncList),
      basicModel: {
        visiable: false,
        title: '',
        content: '',
        type: '',
        rightButton: '',
        data: {},
        loading: false
      }
    }
  },
  mounted () {
    this.fetchRecycleList()
  },
  methods: {
    fetchRecycleList () {
      this.loading = true
      NasFileAPI.fetchRecycleList(this.page).then(response => {
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
    parseResponse (data: BasicResponse) {
      this.totalSize = _.get(data.data, 'total')
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < maxSize) this.busy = true
      list = ResourceHandler.formatResourceList(list).map(item => {
        item.name = item.alias
        return item
      })
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    handleDeletRequest (items: ResourceItem[]) {
      this.loading = true
      NasFileAPI.addDeleteTask(items).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
        this.$store.dispatch('Resource/increaseTask')
      }).catch(error => {
        console.log(error)
        this.$message.error('删除失败')
        this.loading = false
      }).finally(() => {
        this.basicModel.visiable = false
        this.basicModel.loading = false
      })
    },
    handleClearRequest () {
      this.loading = true
      NasFileAPI.clearRecycle().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.dataArray = []
        this.$message.info('回收站已清空')
      }).catch(error => {
        console.log(error)
        this.$message.error('清空失败')
        this.loading = false
      }).finally(() => {
        this.basicModel.visiable = false
        this.basicModel.loading = false
      })
    },
    // 覆盖混入中的方法
    handleRefreshAction () {
      this.page = 1
      this.busy = true
      this.fetchRecycleList()
    },
    handleLoadmoreAction () {
      this.page++
      this.fetchRecycleList()
    },
    handleRecoveryAction () {
      const items = ResourceHandler.getSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      this.loading = true
      NasFileAPI.recoveryFile(items).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络错误')
      })
    },
    handleDeletAction () {
      const items = ResourceHandler.getSelectItems(this.dataArray)
      if (_.isEmpty(items)) return
      const message = items.length > 1 ? `您确定要永久删除所选的${items.length}个项目吗？` : `您确定要永久删除“${items[0].name}”吗？`
      this.basicModel = {
        visiable: true,
        title: '回收站',
        content: message,
        type: 'delete',
        rightButton: '删除',
        data: items,
        loading: false
      }
    },
    handleClearTrashAction () {
      if (_.isEmpty(this.dataArray)) return
      this.basicModel = {
        visiable: true,
        title: '回收站',
        content: '您确定要清空回收站吗？',
        type: 'clearTrash',
        rightButton: '清空',
        data: {},
        loading: false
      }
    },
    handleBasicConfirm (flag, ...args) {
      this.basicModel.loading = true
      if (flag === 'delete') {  // 删除
        this.handleDeletRequest(args[0])
      } else if (flag === 'clearTrash') {  // 清空回收站
        this.handleClearRequest()
      }
    },
    handleOpenFolderAction (item: ResourceItem) {
      // recycle not allow open directory
    }
  }
})
</script>

<style lang="less" scoped>

</style>
