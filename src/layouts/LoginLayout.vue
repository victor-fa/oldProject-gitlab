<template>
  <div class="login-layout">
    <div class="nav">
      <login-status-bar/>
    </div>
    <div class="content">
      <router-view/>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import LoginStatusBar from '../components/LoginStatusBar/index.vue'

export default Vue.extend({
  name: 'login',
  components: {
    LoginStatusBar
  },
  mounted () {
    if (this.$route.name === 'login-layout') this.$router.push('launch')
  }
})
</script>

<style lang="less" scoped>
.login-layout {
  height: 100%;
  background-color: white;
  .nav {
    width: 100%;
    height: 55px;
  }
  .content {
    width: 100%;
    position: absolute;
    top: 55px;
    left: 0px;
    bottom: 0px;
  }
}
</style>
