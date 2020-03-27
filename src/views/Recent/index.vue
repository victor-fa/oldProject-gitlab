<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView, { PageConfig } from '../MainView/index.vue'
import { ResourceItem, OrderType } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'recent',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    let config: PageConfig = { path: '', uuid: '' }
    let stacks: Array<PageConfig> = []
    return {
      loading: false,
      currentPath: '最近',
      dataArray: items,
      pageConfig: config,
      pageConfigStacks: stacks,
      page: 1,
      busy: false
    }
  },
  created () {
    this.fetchUlist()
  },
  methods: {
    fetchUlist () {
      this.loading = true
      NasFileAPI.fetchUlist(this.page).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        console.log(response)
        this.parseResponse(response.data)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    parseResponse (data: BasicResponse) {
      const ulist = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(ulist)) this.busy = true
      ulist.map(value => {
        value.name = StringUtility.formatName(value.path)
        value.showMtime = StringUtility.formatShowMtime(value.mtime)
        value.showSize = StringUtility.formatShowSize(value.size)
      })
      this.dataArray = this.page === 1 ? ulist : this.dataArray.concat(ulist)
    },
    // 重写父类中的方法
    loadMoreData () {
      if (this.busy) return
      this.page++
      this.fetchUlist()
    },
    handleBackAction () {
      this.pageConfig = this.pageConfigStacks.pop()!
      this.page = 1
      this.busy = false
      this.dataArray = []
      this.fetchUlist()
    },
    handleRefreshAction () {
      this.page = 1
      this.busy = false
      this.fetchUlist()
    },
    handleOpenAction (item: ResourceItem) {
      this.pageConfigStacks.push(this.pageConfig)
      this.pageConfig = { path: item.path, uuid: item.uuid }
      this.page = 1
      this.busy = false
      this.dataArray = []
      this.fetchUlist()
    },
    handleSortWayChangeAction (type: OrderType) {
      console.log(type)
    }
  }
})
</script>

<style lang="less" scoped>

</style>
