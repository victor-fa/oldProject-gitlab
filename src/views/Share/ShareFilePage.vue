<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import { ResourceItem, ShareItem } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import ResourceHandler from '../MainView/ResourceHandler'

export default Vue.extend({
  name: 'share-file-page',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    return {
      loading: false,
      currentPath: '',
      dataArray: items,
    }
  },
  watch: {
    $route: {
      handler: function () {
        if (_.isEmpty(this.$route.params.ugreenNo)) return
        this.fetchShareFileList()
        this.currentPath = this.$route.params.showPath
      },
      deep: true
    }
  },
  created () {
    this.fetchShareFileList()
    this.currentPath = this.$route.params.showPath
  },
  methods: {
    fetchShareFileList () {
      this.loading = true
      NasFileAPI.fetchShareFileList(this.$route.params.ugreenNo).then(response => {
        this.loading = false
        console.log(response)
        if (response.data.code !== 200) return
        const list = _.get(response.data.data, 'files') as Array<ShareItem>
        this.dataArray = list.map(item => {
          return ResourceHandler.convertResourceItem(item) as ResourceItem
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    // 重写父类中的方法
    overrideRefreshAction () {
      this.fetchShareFileList()
    },
    overrideOpenFolderAction (item: ResourceItem) {
      console.log(item.name)
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
    }
  }
})
</script>
