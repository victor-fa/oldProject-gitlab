<template>
  <a-row class="resource-header">
    <a-col :span="13">文件名</a-col>
    <a-col :span="6">修改日期</a-col>
    <a-col :span="5">大小</a-col>
  </a-row>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'resource-header'
})
</script>

<style lang="less" scoped>
.resource-header {
  text-align: left;
  font-size: 12px;
  line-height: 12px;
  color: #484848;
  padding: 8px 15px 8px 20px;
  background-color: #f6f8fb;
}
</style>
