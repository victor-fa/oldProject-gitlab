<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView, { PageConfig } from '../MainView/index.vue'
import { ResourceItem, OrderType, CollectItem } from '../../api/NasFileModel'
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
      console.log('fetchCollectList')
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
      // if (_.isEmpty(ulist)) this.busy = true
      // ulist.map(value => {
      //   value.name = StringUtility.formatName(value.path)
      //   value.showMtime = StringUtility.formatShowMtime(value.mtime)
      //   value.showSize = StringUtility.formatShowSize(value.size)
      // })
      // this.dataArray = ulist
    },
    // convertResourceItem (item: CollectItem): ResourceItem {
    //   return {
    //     id: item.file_detail.id,
    //     uuid: item.uuid,
    //     type: item.file_detail.type,
    //     size: item.file_detail.size,
    //     path: item.path,
    //     status: 0,
    //     ctime: item.file_detail.ctime,
    //     mtime: item.file_detail.mtime,
    //     shared: item.file_detail.shared,
    //     utime: item.file_detail.utime,
    //     alias: '',
    //     collected: item.file_detail.collected,
    //     duration: 0,
    //     thumbs: item.file_detail.thumbs,
    //     name: StringUtility.formatName(item.path),
    //     showMtime: StringUtility.formatShowMtime(item.file_detail.mtime),
    //     showSize: StringUtility.formatShowSize(item.file_detail.size),
    //     // custom property
    //     isSelected: false
    //   }
    // },
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
