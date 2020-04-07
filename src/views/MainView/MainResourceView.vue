<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import { ResourceItem, OrderType } from '../../api/NasFileModel'
import NasFileAPI, { TaskMode } from '../../api/NasFileAPI'
import { BasicResponse, User } from '../../api/UserModel'
import ResourceHandler from './ResourceHandler'
import { ClipboardModel } from '../../store/modules/Resource'

export default Vue.extend({
  name: 'main-resource-view',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    return {
      loading: false,
      currentPath: '',
      dataArray: items,
      showArray: items,
      page: 1,
      busy: false,
      order: OrderType.byNameDesc
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('Resource', ['clipboard']),
    path: function () {
      const path = this.$route.query.path as string
      return path
    },
    uuid: function () {
      const uuid = this.$route.query.uuid as string
      return uuid
    }
  },
  watch: {
    $route: {
      handler: function(value) {
        if (!_.isEmpty(this.$route.query)) this.fetchResourceList()
        if (!_.isEmpty(this.$route.params)) this.updateShowPath()
      },
      deep: true
    }
  },
  created () {
    if (this.checkQuery()) this.fetchResourceList()
    if (this.checkParams()) this.updateShowPath()
  },
  methods: {
    checkQuery () {
      const path = this.$route.query.path
      const uuid = this.$route.query.uuid
      const result = !_.isEmpty(path) && !_.isEmpty(uuid)
      if (!result) console.log(`Incorrect parameters: path: ${path}, uuid: ${uuid}`)
      return result
    },
    checkParams () {
      const showPath = this.$route.params.showPath
      const result = _.isEmpty(showPath)
      if (!result) console.log(`Incorrect parameters: showPath: ${showPath}`)
      return !result
    },
    fetchResourceList () {
      this.loading = true
      NasFileAPI.fetchResourceList(this.path, this.uuid, this.page, 20, this.order).then(response => {
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
    updateShowPath () {
      this.currentPath = this.$route.params.showPath
    },
    parseResponse (data: BasicResponse) {
      let list = _.get(data.data, 'list') as Array<ResourceItem>
      if (_.isEmpty(list) || list.length < 20) this.busy = true
      list = ResourceHandler.formateResponseList(list)
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    handlePasteSuccess () {
      this.$message.info('粘贴任务添加成功')
      const isClip = (this.clipboard as ClipboardModel).isClip
      if (isClip) this.$store.dispatch('Resource/updateClipboard', { isClip: false, items: [] })
      this.$store.dispatch('Resource/increaseTask')
    },
    // 重写父类中的方法
    handleBackAction () {
      this.$router.go(-1)
      const length = this.currentPath.lastIndexOf('/')
      this.currentPath = this.currentPath.substring(0, length)
    },
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
    },
    overridePasteAction (mode: TaskMode) {
      const srcItems = ResourceHandler.getSelectItems(this.showArray)
      const dstItem = { path: this.path, uuid: this.uuid } as ResourceItem
      NasFileAPI.addMoveTask(srcItems, dstItem, mode).then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        this.handlePasteSuccess()
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    }
  }
})
</script>
