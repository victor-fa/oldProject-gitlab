<template>
  <div id="app">
    <keep-alive>
      <router-view />
    </keep-alive>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { EventBus, EventType } from './utils/eventBus'

export default Vue.extend({
  name: 'app',
  mounted () {
    EventBus.$on(EventType.showToast, (msg: string) => {
      this.$message.error(msg)
    })
  },
  destroyed () {
    EventBus.$off(EventType.showToast)
  }
})
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #ffffff;
}
* {
  padding: 0px;
  margin: 0px;
}
img {
  -webkit-user-drag: none;
}
</style>
