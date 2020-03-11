<template>
  <transport-list
    ref="realResourceList"
  />
  
  <!-- :style="alterStyle"
    @blur="alterBlur"
    @callback="DiskFeatureControl" -->
</template>

<script lang="ts">
import Vue from 'vue'
import TransportList from '../../components/TransportList/index.vue'
import { realResourceList } from '../MockData/index'

export default {
  name: 'transport',
  components: {
    TransportList
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
