<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainResourceView from '../MainView/MainResourceView.vue'
import { encryptContextMenu } from '@/components/OperateListAlter/operateList'
import { ResourceItem } from '@/api/NasFileModel'
import RouterUtility from '@/utils/RouterUtility'

export default Vue.extend({
  name: 'encrypt-resource-view',
  extends: MainResourceView,
  data () {
    return {
      dataArray: [] as ResourceItem[],
      itemMenu: _.cloneDeep(encryptContextMenu),
      listMenu: []
    }
  },
  methods: {
    // 重写父类中的方法
    handleOpenFolderAction (item: ResourceItem) {
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(item.name, 'encrypt-resource-view', { path, uuid })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
