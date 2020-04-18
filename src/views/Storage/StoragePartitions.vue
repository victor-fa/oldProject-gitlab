<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import StorageList from './index.vue'
import { PartitionInfo } from '../../api/NasFileModel'

export default Vue.extend({
  name: 'storage-partitions',
  extends: StorageList,
  data () {
    return {
      dataArray: [] as PartitionInfo[],
      currentPath: '' // 当前页路径 
    }
  },
  created () {
    const showPath = this.$route.params.showPath
    if (!_.isEmpty(showPath)) this.currentPath = showPath
    const json = this.$route.params.dataSource
    if (!_.isEmpty(json)) this.dataArray = JSON.parse(json)
  },
  methods: {
    fetchStorages () {
    }
  }
})
</script>
