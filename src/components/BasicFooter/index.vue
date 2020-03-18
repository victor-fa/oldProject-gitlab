<template>
  <div class="basic-footer">
    <label>{{ showItemCount }}个项目</label>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  name: 'basic-footer',
  computed: {
    ...mapGetters('Resource', ['showItemCount'])
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
