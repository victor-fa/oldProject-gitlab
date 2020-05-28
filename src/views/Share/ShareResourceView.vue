<script lang="ts">
import Vue from 'vue'
import MainResourceView from '../MainView/MainResourceView.vue'
import { shareResourceContextMenu } from '../../components/OperateListAlter/operateList'
import { ResourceItem } from '../../api/NasFileModel'
import RouterUtility from '../../utils/RouterUtility'
import ResourceHandler from '../MainView/ResourceHandler'
import NasFileAPI from '../../api/NasFileAPI'

export default Vue.extend({
  name: 'share-resource-view',
  extends: MainResourceView,
  data () {
    return {
      dataArray: [] as ResourceItem[],
      itemMenu: shareResourceContextMenu,
      listMenu: []
    }
  },
  methods: {
    // 重写父类中的方法
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(item.name, 'share-resource-view', { path, uuid })
    },
    handleUnshareAction () {
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      NasFileAPI.cancelShare(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('取消成功')
        this.removeItems(items)
      }).catch(_ => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('取消失败')
      })
    },
    // 移除取消的item
    removeItems (items: ResourceItem[]) {
      this.dataArray = this.dataArray.filter(item => {
        return !item.isSelected
      })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
