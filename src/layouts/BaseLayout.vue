<template>
  <a-layout>
      <a-layout-sider class="base-sider">
        <i-logo/>
        <sider-menu/>
      </a-layout-sider>
      <a-layout>
        <a-layout-header class="base-header">
          <basic-header/>
        </a-layout-header>
        <a-layout-content>
          <keep-alive>
            <router-view></router-view>
          </keep-alive>
        </a-layout-content>
        <a-layout-footer class="base-footer">
          <basic-footer/>
        </a-layout-footer>
      </a-layout>
    </a-layout>
</template>

<script lang="ts">
import Vue from 'vue'
import ILogo from '../components/Logo/index.vue'
import SiderMenu from '../components/SiderMenu/index.vue'
import BasicHeader from '../components/BasicHeader/index.vue'
import BasicFooter from '../components/BasicFooter/index.vue'
import processCenter, { EventName } from '../utils/processCenter'

export default Vue.extend({
  name: 'base-layout',
  components: {
    ILogo,
    SiderMenu,
    BasicHeader,
    BasicFooter
  },
  mounted () {
    this.$router.replace('recent')
  }
})
</script>

<style lang="scss" scoped>
.base-sider {
  height: 100vh;
  width: 200px;
  background-color: #edf1f0;
}
.base-header {
  height: 110px;
  padding: 0px;
  background-color: white;
}
.base-content {
  padding: 0px;
  background-color: #f6f8fb;
}
.base-footer {
  height: 17px;
  background-color: #edf1f0;
  padding: 0px;
}
</style>
