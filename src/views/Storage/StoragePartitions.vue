<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import StorageList from './index.vue'
import { PartitionInfo, StorageInfo } from '@/api/NasFileModel'
import { User } from '@/api/UserModel'
import RouterUtility from '@/utils/RouterUtility'

export default Vue.extend({
  name: 'storage-partitions',
  extends: StorageList,
  data () {
    return {
      dataArray: [] as PartitionInfo[],
    }
  },
  computed: {
    ...mapGetters('Resource', ['storages'])
  },
  created () {
    const items = this.storages as StorageInfo[]
    for (let index = 0; index < items.length; index++) {
      const element = items[index]
      if (element.isSelected) {
        this.dataArray = element.partitions
        break
      }
    }
  },
  methods: {
    // 覆盖父类的方法
    fetchStorages () {
    },
    openSelectedItem (index: number) {
      const item = this.dataArray[index]
      const name = item.showName
      const path = item.path
      const uuid = item.uuid
      RouterUtility.push(name, 'main-resource-view', { path, uuid })
    }
  }
})
</script>
