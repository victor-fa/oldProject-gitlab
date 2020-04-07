<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import { ResourceItem, StorageInfo } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'

export default Vue.extend({
  name: 'storage',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    return {
      loading: false,
      currentPath: '存储',
      dataArray: items
    }
  },
  methods: {
    fetchStorages () {
      this.loading = true
      NasFileAPI.fetchStorages().then(response => {
        if (response.data.code !== 200) return
        const storages = _.get(response.data.data, 'storages') as Array<StorageInfo>
        console.log(storages)
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    // 重写父类中的方法
    overrideRefreshAction () {

    },
    overrideOpenFolderAction (item: ResourceItem) {

    },
    overrideBackAction () {

    },
    overrideSortWayChangeAction () {

    }
  }
})
</script>

<style lang="less" scoped>

</style>
