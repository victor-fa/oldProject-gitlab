<script lang="ts">
import Vue from 'vue'
import MainResourceView from '../MainView/MainResourceView.vue'
import { recentContextMenu } from '../../components/OperateListAlter/operateList'
import { ResourceItem } from '../../api/NasFileModel'

export default Vue.extend({
  name: 'recent-resource-view',
  extends: MainResourceView,
  data () {
    return {
      currentPath: '',
      itemContextMenu: recentContextMenu
    }
  },
  methods: {
    // 重写父类中的方法
    handleRouteChange () {
      return this.$route.name === 'recent-reasource-view'
    },
    handleOpenFolderAction (item: ResourceItem) {
      this.$router.push({
        name: 'recent-reasource-view',
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
