<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import Recycle from './index.vue'
import { ResourceItem, OrderType } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import ResourceHandler from '../MainView/ResourceHandler'

export default Vue.extend({
  name: 'recycle-resource-view',
  extends: Recycle,
  data () {
    return {
      page: 0,
      busy: false,
      loading: false,
      order: OrderType.byNameDesc,
      dataArray: [] as ResourceItem[]
    }
  },
  computed: {
    path: function () {
      return this.$route.query.path as string
    },
    uuid: function () {
      return this.$route.query.uuid as string
    }
  },
  mounted () {
    if (this.checkQuery()) this.fetchRecycleList()
  },
  methods: {
    checkQuery () {
      if (_.isEmpty(this.path) || _.isEmpty(this.uuid)) {
        return false
      }
      return true
    },
    // 重写父类中的方法
    fetchRecycleList () {
      this.loading = true
      NasFileAPI.fetchResourceList(this.path, this.uuid, this.page, this.order).then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        let list = _.get(response.data.data, 'list') as ResourceItem[]
        if (_.isEmpty(list) || list.length < 20) this.busy = true
        list = ResourceHandler.formatResourceList(list)
        this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
