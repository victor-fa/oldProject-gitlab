<template>
  <div class="network-tip">
    <span class="tip">网络不可用/设备连接断开</span>
    <a-icon v-if="loading" type="loading" class="spin-icon" spin/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'network-tip',
  props: {
    loading: {
      default: false
    }
  }
})
</script>

<style lang="less" scoped>
.network-tip {
  height: 28px;
  width: 100%;
  background-color: #FFB77819;
  display: flex;
  align-items: center;
  justify-content: center;
  .tip {
    color: #FF7800;
    font-size: 12px;
    text-align: center;
  }
  .spin-icon {
    margin-left: 8px;
    font-size: 14px;
    color: #FF7800;
  }
}
</style>
