<template>
  <div class="main-bottom-view">
    <label>{{ itemCount }}个项目</label>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'main-bottom-view',
  props: {
    itemCount: {
      type: Number,
      default: 0
    }
  }
})
</script>

<style lang="less" scoped>
.main-bottom-view {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background-color: #edf1f0;
  label {
    font-size: 12px;
    color: #484848;
    line-height: 17px;
    margin-right: 18px;
  }
}
</style>
