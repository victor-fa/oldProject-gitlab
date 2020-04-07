<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import { ResourceItem, OrderType, UploadTimeSort } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'
import { uploadSortList } from '../../model/sortList'
import ResourceHandler from '../MainView/ResourceHandler'

export default Vue.extend({
  name: 'recent',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    return {
      loading: false,
      currentPath: '最近',
      dataArray: items,
      page: 1,
      busy: false,
      sortList: uploadSortList,
      uploadOrder: UploadTimeSort.descend, // 上传列表的排序方式
      order: OrderType.byNameDesc // 目录列表的排序方式
    }
  },
  created () {
    this.fetchUlist()
  },
  methods: {
    fetchUlist () {
      this.loading = true
      NasFileAPI.fetchUlist(this.page, this.uploadOrder).then(response => {
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
      let ulist = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(ulist) || ulist.length < 20) this.busy = true
      ulist = ResourceHandler.formateResponseList(ulist)
      this.dataArray = this.page === 1 ? ulist : this.dataArray.concat(ulist)
    },
    // 重写父类中的方法
    overrideloadMoreData () {
      if (this.busy) return
      this.page++
      this.fetchUlist()
    },
    overrideRefreshAction () {
      this.page = 1
      this.busy = false
      this.fetchUlist()
    },
    overrideOpenFolderAction (item: ResourceItem) {
      this.$router.push({
        name: 'main-resource-view',
        query: {
          path: item.path,
          uuid: item.uuid
        },
        params: {
          showPath: `${this.currentPath}/${item.name}`
        }
      })
    },
    overrideSortWayChangeAction (type: OrderType) {
      if (type === OrderType.ByUploadDesc) {
        this.uploadOrder = UploadTimeSort.descend
      } else if (type === OrderType.ByUploadAsc) {
        this.uploadOrder = UploadTimeSort.ascend
      }
      this.page = 1
      this.busy = false
      this.fetchUlist()
    }
  }
})
</script>

<style lang="less" scoped>

</style>
