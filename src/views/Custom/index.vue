<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import { mapGetters } from 'vuex'
import { ResourceItem, StorageInfo, OrderType } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { User, BasicResponse } from '../../api/UserModel'
import { EventBus, EventType } from '../../utils/eventBus'
import processCenter, { EventName } from '../../utils/processCenter'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'custom',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    let config: PageConfig = { path: '', uuid: '' }
    let stacks: Array<PageConfig> = []
    return {
      loading: false,
      currentPath: '网盘',
      dataArray: items,
      pageConfig: config,
      pageConfigStacks: stacks,
      page: 1,
      busy: false
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('Resource', ['storages'])
  },
  created () {
    this.fetchStorage()
  },
  methods: {
    fetchStorage () {
      this.loading = true
      NasFileAPI.fetchStorages().then(response => {
        if (response.data.code !== 200) return
        const storages = response.data.data.storages as Array<StorageInfo>
        this.$store.dispatch('Resource/updateStorages', storages)
        this.pageConfig.path = `/.ugreen_nas/${(this.user as User).ugreenNo}`
        this.pageConfig.uuid = storages[0].partitions[0].uuid
        this.fetchResourceList()
      }).catch(error => {
        this.loading = false
        console.log(error)
      })
    },
    fetchResourceList (orderType: OrderType = OrderType.byNameDesc) {
      this.loading = true
      NasFileAPI.fetchResourceList(this.pageConfig.path, this.pageConfig.uuid, this.page, 20, orderType).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        this.loading = false
        console.log(error)
      })
    },
    parseResponse (data: BasicResponse) {
      const list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list)) this.busy = true
      list.map(value => {
        value.name = StringUtility.formatName(value.path)
        value.showMtime = StringUtility.formatShowMtime(value.mtime)
        value.showSize = StringUtility.formatShowSize(value.size)
      })
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    // 重写父类中的方法
    loadMoreData () {
      if (this.busy) return
      this.page++
      this.fetchResourceList()
    },
    handleBackAction () {
      this.pageConfig = this.pageConfigStacks.pop()!
      this.page = 1
      this.busy = false
      this.dataArray = []
      this.fetchResourceList()
    },
    handleRefreshAction () {
      this.page = 1
      this.busy = false
      this.fetchResourceList()
    },
    handleOpenAction (item: ResourceItem) {
      this.pageConfigStacks.push(this.pageConfig)
      this.pageConfig = { path: item.path, uuid: item.uuid }
      this.page = 1
      this.busy = false
      this.dataArray = []
      this.fetchResourceList()
    },
    handleSortWayChangeAction (order: OrderType) {
      console.log(order)
      this.page = 1
      this.busy = false
      this.fetchResourceList(order)
    }
  }
})
interface PageConfig {
  path: string, 
  uuid: string
}
</script>

<style lang="less" scoped>

</style>
