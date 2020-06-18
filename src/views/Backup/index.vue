<template>
  <div class="backup">
    <basic-tabs :tabs="categorys" v-on:tabChange="handleTabsChange"/>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import BasicTabs from '@/components/BasicTabs/index.vue'
import { backupCategorys, BackupCategoryType } from '@/model/categoryList'

export default Vue.extend({
  name: 'backup',
  components: {
    BasicTabs
  },
  data () {
    return {
      categorys: _.cloneDeep(backupCategorys)
    }
  },
  watch: {
    $route: {
      handler: function () {
        if (this.$route.name === 'backup') {
          const item = this.categorys.filter(item => {
            return item.isSelected
          })[0]
          this.$router.replace(item.type as BackupCategoryType)
        }
      }
    }
  },
  created () {
    if (this.$route.name !== 'list') this.$router.push('list')
  },
  methods: {
    handleTabsChange (index: number) {
      const item = this.categorys[index]
      if (this.$route.name !== item.type) this.$router.replace(item.type as BackupCategoryType)
    }
  }
})
</script>

<style scoped>
.backup {
  background-color: white;
}
</style>
