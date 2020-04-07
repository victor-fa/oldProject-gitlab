<template>
  <main-page/>
</template>

<script lang="ts">
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'

export default Vue.extend({
  name: 'remote-list',
  components: {
    MainPage
  }
})
</script>

<style lang="less" scoped>

</style>
