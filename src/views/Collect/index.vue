<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView, { PageConfig } from '../MainView/index.vue'
import { ResourceItem, OrderType, CollectItem, ResourceStatus } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'collect',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    let config: PageConfig = { path: '', uuid: '' }
    let stacks: Array<PageConfig> = []
    return {
      loading: false,
      currentPath: '收藏',
      dataArray: items,
      pageConfig: config,
      pageConfigStacks: stacks,
      busy: false
    }
  },
  created () {
    this.fetchCollectList()
  },
  methods: {
    fetchCollectList () {
      this.loading = true
      NasFileAPI.fetchCollectList().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        console.log(response)
        this.parseResponse(response.data)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    parseResponse (data: BasicResponse) {
      const ulist = _.get(data.data, 'files') as Array<CollectItem>
      if (_.isEmpty(ulist)) this.busy = true
      this.dataArray = ulist.map(item => {
        return this.convertResourceItem(item) as ResourceItem
      })
    },
    convertResourceItem (item: CollectItem) {
      return {
        id: item.file_detail.id,
        uuid: item.uuid,
        type: item.file_detail.type,
        size: item.file_detail.size,
        path: item.path,
        ctime: item.file_detail.ctime,
        mtime: item.file_detail.mtime,
        shared: item.file_detail.shared,
        utime: item.file_detail.atime,
        collected: item.file_detail.collected,
        thumbs: item.file_detail.thumbs,
        name: StringUtility.formatName(item.path),
        showMtime: StringUtility.formatShowMtime(item.file_detail.mtime),
        showSize: StringUtility.formatShowSize(item.file_detail.size)
      }
    },
    // 重写父类中的方法
    handleBackAction () {
      this.pageConfig = this.pageConfigStacks.pop()!
      this.busy = false
      this.dataArray = []
      this.fetchCollectList()
    },
    handleRefreshAction () {
      this.busy = false
      this.fetchCollectList()
    },
    handleOpenAction (item: ResourceItem) {
      // TODO: 收藏列表中的打开目录需要重新处理
      this.pageConfigStacks.push(this.pageConfig)
      this.pageConfig = { path: item.path, uuid: item.uuid }
      this.busy = false
      this.dataArray = []
      this.fetchCollectList()
    },
    handleSortWayChangeAction (type: OrderType) {
      console.log(type)
    }
  }
})
</script>

<style lang="less" scoped>

</style>
