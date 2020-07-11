<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import EncryptView from './index.vue'
import { encryptContextMenu } from '@/components/OperateListAlter/operateList'
import { ResourceItem, OrderType } from '@/api/NasFileModel'
import RouterUtility from '@/utils/RouterUtility'
import NasFileAPI, { maxSize } from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'
import ResourceHandler from '../MainView/ResourceHandler'

export default Vue.extend({
  name: 'encrypt-resource-view',
  extends: EncryptView,
  data () {
    return {
      page: 1,
      busy: false,
      totalSize: 0,
      loading: false,
      order: OrderType.byNameDesc,
      dataArray: [] as ResourceItem[],
      showListMenu: _.cloneDeep(encryptContextMenu)
    }
  },
  computed: {
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
      handler: function () {
        this.updateView()
      }
    }
  },
  mounted () {
    this.updateView()
  },
  methods: {
    updateView () {
      this.dataArray = [] // 新的界面，需要清空缓存的数据
      if (this.checkQuery()) {
        this.page = 1
        this.busy = false
        this.getEncryptList()
      }
    },
    checkQuery () {
      if (_.isEmpty(this.path) || _.isEmpty(this.uuid)) {
        return false
      }
      return true
    },
    // 重写父类中的方法
    handleSortWayChangeAction (order: OrderType) {
      this.order = order
      this.page = 1
      this.busy = false
      this.getEncryptList()
    },
    getEncryptList() {
      this.loading = true
      NasFileAPI.getEncryptList(this.path, this.uuid, this.page, this.order).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        this.parseResponse(response.data)
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    parseResponse (data: BasicResponse) {
      this.totalSize = _.get(data.data, 'total')
      let list = _.get(data.data, 'list') as ResourceItem[]
      if (_.isEmpty(list) || list.length < maxSize) this.busy = true
      list = ResourceHandler.formatResourceList(list)
      this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
    },
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(item.name, 'encrypt-resource-view', { path, uuid })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
