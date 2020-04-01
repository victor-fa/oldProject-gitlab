<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import { ResourceItem, OrderType, CollectItem, ResourceStatus, ShareUser, ResourceType } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import { BasicResponse } from '../../api/UserModel'
import ResourceHandler from '../MainView/ResourceHandler'

export default Vue.extend({
  name: 'share',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    return {
      loading: false,
      currentPath: '分享',
      dataArray: items,
      disableAlter: true,
      ugreenNo: '' // 当前选中的用户编号
    }
  },
  created () {
    this.fetchShareUserList()
  },
  methods: {
    fetchShareUserList () {
      this.loading = true
      NasFileAPI.fetchShareUserList().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        console.log(response)
        const users = _.get(response.data.data, 'nas_users') as Array<ShareUser>
        this.dataArray = users.map(user => {
          return {
            type: ResourceType.folder,
            name: _.isEmpty(user.nick_name) ? user.ugreen_no : user.nick_name,
            path: user.ugreen_no
          } as ResourceItem
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    // 重写父类中的方法
    overrideRefreshAction () {
      this.fetchShareUserList()
    },
    overrideOpenFolderAction (item: ResourceItem) {
      this.$router.push({
        name: 'share-file-page',
        params: {
          ugreenNo: item.path,
          showPath: `${this.currentPath}/${item.name}`
        }
      })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
