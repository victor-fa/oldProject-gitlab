<template>
  <div class="main-bottom-view">
    <label>共{{ itemCount }}个项目</label>
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
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  label {
    font-size: 12px;
    color: #484848;
  }
}
</style>
