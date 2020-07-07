<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainResourceView from '../MainView/MainResourceView.vue'
import { collectContextMenu } from '@/components/OperateListAlter/operateList'
import { ResourceItem } from '@/api/NasFileModel'
import RouterUtility from '@/utils/RouterUtility'
import ResourceHandler from '../MainView/ResourceHandler'
import NasFileAPI from '@/api/NasFileAPI'

export default Vue.extend({
  name: 'collect-resource-view',
  extends: MainResourceView,
  data () {
    return {
      dataArray: [] as ResourceItem[],
      itemMenu: _.cloneDeep(collectContextMenu),
      listMenu: []
    }
  },
  methods: {
    // 重写父类中的方法
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(item.name, 'collect-resource-view', { path, uuid })
    },
    handleUnCollectAction () {
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      NasFileAPI.cancelShare(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('取消成功')
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
      }).catch(error => {
        console.log(error)
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('取消失败')
      })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
