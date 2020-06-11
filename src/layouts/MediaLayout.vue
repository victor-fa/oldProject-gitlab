<template>
  <div>
    <window-menu class="window-menu"/>
    <keep-alive>
      <router-view/>
    </keep-alive>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import WindowMenu from '@/components/WindowMenu/index.vue'
import processCenter, { MainEventName } from '@/utils/processCenter'

export default Vue.extend({
  name: 'media-layout',
  components: {
    WindowMenu
  },
  created () {
    processCenter.renderObserver(MainEventName.mediaInfo, (event, data) => {
      const path = data.path
      const params = data.params
      this.$router.push({
        name: path,
        params
      })
    })
  },
  destroyed () {
    processCenter.removeRenderObserver(MainEventName.mediaInfo)
  }
})
</script>

<style lang="less" scoped>
.window-menu {
  -webkit-user-drag: drag;
  height: 40px;
  padding-right: 30px;
  background-color: #fdffff;
}
</style>
