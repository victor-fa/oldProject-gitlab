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
  name: 'recent',
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
.resource-list {
  background-color: white;
  overflow: auto;
  padding: 20px 20px 0px;
  .resource-item {
    padding: 20px 30px;
    img {
      width: 42px;
      margin-bottom: 20px;
    }
    span {
      display: block;
      font-size: 12px;
      line-height: 12px;
      color: #484848;
    }
  }
  .loading-container {
    position: absolute;
    bottom: 40px;
    width: 100%;
    text-align: center;
  }
}
</style>
