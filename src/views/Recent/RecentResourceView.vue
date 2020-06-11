<script lang="ts">
import Vue from 'vue'
import MainResourceView from '../MainView/MainResourceView.vue'
import { recentContextMenu } from '@/components/OperateListAlter/operateList'
import { ResourceItem } from '@/api/NasFileModel'
import RouterUtility from '@/utils/RouterUtility'

export default Vue.extend({
  name: 'recent-resource-view',
  extends: MainResourceView,
  data () {
    return {
      itemMenu: recentContextMenu,
      listMenu: []
    }
  },
  methods: {
    // 重写父类中的方法
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(item.name, 'recent-resource-view', { path, uuid })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
