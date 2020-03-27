<template>
  <div>
    <transport-header-view/>
    <TransportList
      ref="realResourceList"
    />
    <main-bottom-view/>
  </div>
  
  <!-- :style="alterStyle"
    @blur="alterBlur"
    @callback="DiskFeatureControl" -->
</template>

<script lang="ts">
import Vue from 'vue'
import TransportHeaderView from './TransportHeaderView.vue'
import MainBottomView from '../MainView/MainBottomView.vue'
import TransportList from '../../components/TransportList/index.vue'
import { realResourceList } from '../MockData/index'
import { TRANSFORM_INFO } from '../../common/constants'

export default {
  name: 'transport',
  components: {
    TransportList,
    TransportHeaderView,
    MainBottomView
  },
  data () {
    return {
      dataArray: realResourceList
    }
  },
  mounted () {
    console.log(realResourceList);
    console.log(localStorage.getItem(TRANSFORM_INFO));
  }
}
</script>

<style lang="less" scoped>

</style>
