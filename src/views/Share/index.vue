<template>
  <main-view
    :loading="loading"
    :dataSource="dataArray"
    :funcList="showFuncList"
    v-on:headerCallbackActions="handleHeaderActions"
    v-on:listCallbackActions="handleListActions"
    v-on:itemCallbackActions="handleItemActions"
    v-on:contextMenuCallbackActions="handleContextMenuActions"
  />
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'
import { ResourceItem, OrderType, CollectItem, ResourceStatus, ShareUser, ResourceType } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import { BasicResponse, User } from '@/api/UserModel'
import ResourceHandler from '../MainView/ResourceHandler'
import RouterUtility from '@/utils/RouterUtility'
import { shareFuncList } from '../MainView/ResourceFuncList'

export default Vue.extend({
  name: 'share',
  components: {
    MainView,
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
      dataArray: [] as ResourceItem[],
      ugreenNo: '', // 当前选中的用户编号
      showFuncList: _.clone(shareFuncList)
    }
  },
  computed: {
    ...mapGetters('User', ['user'])
  },
  mounted () {
    this.fetchShareUserList()
  },
  methods: {
    fetchShareUserList () {
      this.loading = true
      NasFileAPI.fetchShareUserList().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        console.log(response)
        const users = _.get(response.data.data, 'nas_users') as Array<ShareUser>
        this.dataArray = this.convertShareUserList(users)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    // 转换分享用户列表
    convertShareUserList (list: ShareUser[]) {
      return list.map((item, index) => {
        let name = _.isEmpty(item.nic_name) ? item.ugreen_no.toString() : item.nic_name
        if (item.ugreen_no === (this.user as User).ugreenNo)  name = '我'
        return {
          type: ResourceType.folder,
          name: `${name}的分享`,
          path: item.ugreen_no.toString()
        } as any
      })
    },
    // 覆盖混入中的方法
    handleRefreshAction () {
      this.fetchShareUserList()
    },
    handleOpenFolderAction (item: ResourceItem) {
      const name = item.name
      const ugreenNo = item.path
      RouterUtility.push(name, 'share-file-page', { ugreenNo })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
