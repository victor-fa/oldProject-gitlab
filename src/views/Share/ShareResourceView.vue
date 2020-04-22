<script lang="ts">
import Vue from 'vue'
import MainResourceView from '../MainView/MainResourceView.vue'
import { shareResourceContextMenu } from '../../components/OperateListAlter/operateList'
import { ResourceItem } from '../../api/NasFileModel'

export default Vue.extend({
  name: 'share-resource-view',
  extends: MainResourceView,
  data () {
    return {
      currentPath: '',
      itemContextMenu: shareResourceContextMenu
    }
  },
  methods: {
    // 重写父类中的方法
    handleRouteChange () {
      return this.$route.name === 'share-reasource-view'
    },
    handleOpenFolderAction (item: ResourceItem) {
      this.$router.push({
        name: 'share-reasource-view',
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

<style lang="less" scoped>

</style>
