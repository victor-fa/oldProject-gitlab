<template>
  <resource-list
    :dataSource="dataArray"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import ResourceList from '../../components/ResourceList/index.vue'
import { realResourceList } from '../MockData/index'

export default {
  name: 'share',
  components: {
    ResourceList
  },
  data () {
    return {
      dataArray: realResourceList
    }
  }
}
</script>

<style lang="less" scoped>

</style>
