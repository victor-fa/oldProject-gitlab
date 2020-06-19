<template>
  <div :style="{ height: scrollHeight + 'px' }"
    >
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
      categorys: _.cloneDeep(backupCategorys),
      scrollHeight: 0
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
    this.scrollHeight = document.body.clientHeight - 98
    const _this = this as any
    window.onresize = () => {
      return (() => {
        _this.scrollHeight = document.body.clientHeight - 98
      })()
    }
  },
  methods: {
    handleTabsChange (index: number) {
      const item = this.categorys[index]
      if (this.$route.name !== item.type) this.$router.replace(item.type as BackupCategoryType)
    }
  }
})
</script>

<style lang="less" scoped>

</style>
