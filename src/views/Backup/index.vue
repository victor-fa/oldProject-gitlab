<template>
  <resource-list
    :dataSource="dataArray"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import ResourceList from '../../components/ResourceList/index.vue'
import { resourceList } from '../MockData/index'

export default {
  name: 'backup',
  components: {
    ResourceList
  },
  data () {
    return {
      dataArray: resourceList
    }
  }
}
</script>

<style lang="less" scoped>

</style>
