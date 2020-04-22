<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import StorageList from './index.vue'
import { PartitionInfo, StorageInfo } from '../../api/NasFileModel'
import { User } from '../../api/UserModel'

export default Vue.extend({
  name: 'storage-partitions',
  extends: StorageList,
  data () {
    return {
      dataArray: [] as PartitionInfo[],
      currentPath: '' // 当前页路径 
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('Resource', ['storages'])
  },
  created () {
    const showPath = this.$route.query.showPath as string
    if (!_.isEmpty(showPath)) this.currentPath = showPath
    const items = this.storages as StorageInfo[]
    for (let index = 0; index < items.length; index++) {
      const element = items[index]
      if (element.isSelected) {
        this.dataArray = element.partitions
      }
    }
  },
  methods: {
    // 覆盖父类的方法
    fetchStorages () {
    },
    openSelectedItem (index: number) {
      const item = this.dataArray[index]
      const no = (this.user as User).ugreenNo
      const path = item.isInternal ? `/.ugreen_nas/${no}` : `/${no}`
      this.$router.push({
        name: 'main-resource-view',
        query: {
          path,
          uuid: item.uuid
        },
        params: {
          showPath: `${this.currentPath}/${item.showName}`
        }
      })
    }
  }
})
</script>
