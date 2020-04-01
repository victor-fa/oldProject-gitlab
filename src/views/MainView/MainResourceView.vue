<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import { ResourceItem, OrderType } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse, User } from '../../api/UserModel'
import StringUtility from '../../utils/StringUtility'
import ResourceHandler from './ResourceHandler'

export default Vue.extend({
  name: 'main-resource-view',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    return {
      loading: false,
      currentPath: '',
      dataArray: items,
      page: 1,
      busy: false,
      order: OrderType.byNameDesc
    }
  },
  computed: {
    ...mapGetters('User', ['user'])
  },
  watch: {
    $route: {
      handler: function(value) {
        if (_.isEmpty(this.$route.query)) return
        this.fetchResourceList()
        this.currentPath = this.$route.params.showPath
      },
      deep: true
    }
  },
  created () {
    if (this.checkQueryParams()) this.fetchResourceList()
    this.currentPath = this.$route.params.showPath
  },
  methods: {
    checkQueryParams () {
      const path = this.$route.query.path
      const uuid = this.$route.query.uuid
      const result = !_.isEmpty(path) && !_.isEmpty(uuid)
      if (!result) console.log(`Incorrect parameters: path: ${path}, uuid: ${uuid}`)
      return result
    },
    fetchResourceList () {
      this.loading = true
      const path = this.$route.query.path as string
      const uuid = this.$route.query.uuid as string
      NasFileAPI.fetchResourceList(path, uuid, this.page, 20, this.order).then(response => {
        console.log(response)
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
    overrideRefreshAction () {
      this.page = 1
      this.busy = false
      this.fetchResourceList()
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
    overrideSortWayChangeAction (order: OrderType) {
      this.page = 1
      this.busy = false
      this.order = order
      this.fetchResourceList()
    },
    overrideSearchAction (keyword: string) {
      this.loading = true
      const prefix = `/.ugreen_nas/${(this.user as User).ugreenNo}`
      const uuid = this.$route.query.uuid as string
      let path = this.$route.query.path as string
      path = path.substring(prefix.length, path.length)
      path = path.length === 0 ? '/' : path
      NasFileAPI.searchFile(uuid, path, keyword).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'list') as Array<ResourceItem>
        this.dataArray = ResourceHandler.formateResponseList(list)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    }
  }
})
</script>
