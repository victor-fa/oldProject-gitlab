<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainResourceView from '../MainView/MainResourceView.vue'
import { encryptResourceContextMenu } from '../../components/OperateListAlter/operateList'
import { ResourceItem } from '../../api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import ResourceHandler from '../MainView/ResourceHandler'

export default Vue.extend({
  name: 'encrypt-resource-view',
  extends: MainResourceView,
  data () {
    return {
      currentPath: '',
      itemContextMenu: encryptResourceContextMenu,
      loading: false,
      dataArray: [],
      encryptLogin: {
        isVisiable: false,
        securityPassword: ''
      },
      page: 1,
      busy: false,
      alreadyLogin: false,  // 是否已登录
    }
  },
  methods: {
    // 重写父类中的方法
    handleRouteChange () {
      return this.$route.name === 'encrypt-reasource-view'
    },
    handleOpenFolderAction (item: ResourceItem) {
      this.$router.push({
        name: 'encrypt-reasource-view',
        query: {
          path: item.path,
          uuid: item.uuid
        },
        params: {
          showPath: `${this.currentPath}/${item.name}`
        }
      })
    },
    fetchAllList () {
      // TODO：处理二级目录
      console.log('处理二级目录');
      // this.loading = true
      // NasFileAPI.getEncryptList().then(response => {
      //   this.loading = false
      //   if (response.data.code !== 200) {
      //     if (response.data.code === 4004) {  // 针对Resource Not Found
      //       this.dataArray = []
      //       return
      //     }
      //     this.encryptLogin.isVisiable = true // 弹出登录窗口
      //     return
      //   }
      //   let list = _.get(response.data.data, 'list')
      //   if (_.isEmpty(list) || list.length < 20) this.busy = true
      //   list = ResourceHandler.formatResourceList(list)
      //   this.dataArray = this.page === 1 ? list : this.dataArray.concat(list)
      //   this.alreadyLogin = true
      // }).catch(error => {
      //   this.loading = false
      //   console.log(error)
      //   this.encryptLogin.isVisiable = true
      // })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
