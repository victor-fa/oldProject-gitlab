<template>
  <div>
    <header-bar/>
    <middle-bar/>
    <bottom-bar/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import HeaderBar from './HeaderBar.vue'
import MiddleBar from './MiddleBar.vue'
import BottomBar from './BottomBar.vue'

export default Vue.extend({
  name: 'basic-header',
  components: {
    HeaderBar,
    MiddleBar,
    BottomBar
  }
})
</script>

<style lang="less" scoped>

</style>
