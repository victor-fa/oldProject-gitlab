<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView, { PageConfig } from '../MainView/index.vue'
import { ResourceItem, OrderType, UploadTimeSort } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'
import StringUtility from '../../utils/StringUtility'
import { uploadSortList } from '../../model/sortList'

export default Vue.extend({
  name: 'backup',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    let config: PageConfig = { path: '', uuid: '' }
    let stacks: Array<PageConfig> = []
    return {
      loading: false,
      currentPath: '备份',
      dataArray: items,
      pageConfig: config,
      pageConfigStacks: stacks,
      page: 1,
      busy: false,
      sortList: uploadSortList,
      order: OrderType.byNameDesc,
      rootPath: {
        flag: true,
        path: '',
        uuid: ''
      }
    }
  },
  created () {
    this.fetchBackuplist()
  },
  methods: {
    fetchBackuplist () {  // 备份列表查询
      this.loading = true
      NasFileAPI.fetchBackuplist().then(response => {
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
    fetchResourceList () {  
      this.loading = true
      NasFileAPI.fetchResourceList(this.pageConfig.path, this.pageConfig.uuid, this.page, 20, this.order).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
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
    overrideloadMoreData () {
      if (this.busy) return
      this.page++
      this.fetchResourceList()
    },
    overrideBackAction () {
      this.page = 1
      this.busy = false
      this.dataArray = []
      if (this.pageConfig.path === this.rootPath.path) {  // 当前为根路径
        this.rootPath.flag = true
        this.fetchBackuplist()  // 根目录下请求根目录
      } else {
        this.pageConfig = this.pageConfigStacks.pop()!
        this.fetchResourceList()  // 非根目录下请求查询文件资源接口
      }
    },
    overrideRefreshAction () {
      this.page = 1
      this.busy = false
      this.fetchResourceList()
    },
    overrideOpenAction (item: ResourceItem) {
      if (this.rootPath.flag) { // 仅当根目录时需要定义它的path
        this.rootPath.path = item.path
        this.rootPath.uuid = item.uuid
        this.rootPath.flag = false
      }
      this.pageConfigStacks.push(this.pageConfig)
      this.pageConfig = {
        path: item.path,
        uuid: item.uuid
      }
      this.page = 1
      this.busy = false
      this.dataArray = []
      this.fetchResourceList()
    },
    overrideSortWayChangeAction (order: OrderType) {
      this.page = 1
      this.busy = false
      this.order = order
      this.fetchResourceList()
    }
  }
})
</script>

<style lang="less" scoped>

</style>
