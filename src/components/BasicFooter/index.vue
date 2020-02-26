<template>
  <div class="basic-footer">
    <label>147个项目</label>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  data () {
    return {
    }
  }
})
</script>

<style lang="less" scoped>
.basic-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  label {
    font-size: 12px;
    color: #484848;
    line-height: 17px;
    margin-right: 18px;
  }
}
</style>
