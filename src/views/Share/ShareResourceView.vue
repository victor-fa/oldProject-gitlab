<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainResourceView from '../MainView/MainResourceView.vue'
import { shareContextMenu, shareResourceContextMenu } from '@/components/OperateListAlter/operateList'
import { ResourceItem } from '@/api/NasFileModel'
import RouterUtility from '@/utils/RouterUtility'
import ResourceHandler from '../MainView/ResourceHandler'
import NasFileAPI from '@/api/NasFileAPI'

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
  computed: {
    isSelf: function () {
      const isSelf = this.$route.params.isSelf as string
      return isSelf
    }
  },
  methods: {
    // 重写父类中的方法
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      const isSelf = this.isSelf
      RouterUtility.push(item.name, 'share-resource-view', { path, uuid }, { isSelf })
    },
    handleUnshareAction () {
      const items = ResourceHandler.disableSelectItems(this.dataArray)
      NasFileAPI.cancelShare(items).then(response => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        if (response.data.code !== 200) return
        this.$message.info('取消成功')
        this.dataArray = ResourceHandler.removeSelectedItems(this.dataArray)
      }).catch(_ => {
        this.dataArray = ResourceHandler.resetDisableState(this.dataArray)
        this.$message.error('取消失败')
      })
    }
  }
})
const generateItemMenu = (isSelf: string) => {
  const flag = isSelf === 'true' ? true : false
  let itemMenu = _.cloneDeep(shareContextMenu)
  itemMenu = itemMenu.map(group => {
    const items = group.items.map(item => {
      if (item.command === 'unshare') item.disable = !flag
      return item
    })
    group.items = items
    return group
  })
  return itemMenu
}
</script>

<style lang="less" scoped>

</style>
