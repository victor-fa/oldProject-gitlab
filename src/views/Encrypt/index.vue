<script lang="ts">
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import { ResourceItem, OrderType } from '../../api/NasFileModel'

export default Vue.extend({
  name: 'encrypt',
  extends: MainView,
  data () {
    let items: Array<ResourceItem> = []
    return {
      loading: false,
      currentPath: '最近',
      dataArray: items,
      page: 1,
      busy: false
    }
  },
  methods: {
    // 重写父类中的方法
    overrideloadMoreData () {

    },
    overrideRefreshAction () {

    },
    overrideOpenFolderAction (item: ResourceItem) {

    },
    overrideSortWayChangeAction (type: OrderType) {

    }
  }
})
</script>
