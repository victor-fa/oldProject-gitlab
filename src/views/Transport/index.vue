<template>
  <div class="transport">
    <basic-tabs :tabs="categorys" v-on:tabChange="handleTabsChange"/>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import BasicTabs from '../../components/BasicTabs/index.vue'
import { taskCategorys } from '../../model/categoryList'

export default Vue.extend({
  name: 'transport',
  components: {
    BasicTabs
  },
  data () {
    return {
      categorys: _.cloneDeep(taskCategorys)
    }
  },
  watch: {
    $route: {
      handler: function () {
        if (this.$route.name === 'transport') {
          const item = this.categorys.filter(item => {
            return item.isSelected
          })[0]
          this.$router.replace(item.type)
        }
      }
    }
  },
  created () {
    if (this.$route.name !== 'download') this.$router.push('download')
  },
  methods: {
    handleTabsChange (index: number) {
      const item = this.categorys[index]
      if (this.$route.name !== item.type) this.$router.replace(item.type)
    }
  }
})
</script>

<style lang="less" scoped>
.transport {
  background-color: white;
}
</style>
