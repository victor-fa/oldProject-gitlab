<template>
  <div class="login-layout">
    <div class="left">
      <div class="left-content">
        <img src="../assets/big_logo.png">
        <span>绿联云</span>
      </div>
    </div>
    <div class="right">
      <window-menu class="window-menu"/>
      <keep-alive>
        <router-view></router-view>
      </keep-alive>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import WindowMenu from '../components/WindowMenu/index.vue'

export default Vue.extend({
  name: 'login-layout',
  components: {
    WindowMenu
  },
  mounted () {
    const secondPath = this.$route.params.secondPath
    const loadPath = _.isEmpty(secondPath) ? 'login' : secondPath 
    this.$router.replace(loadPath)
  }
})
</script>

<style lang="less" scoped>
.login-layout {
  display: flex;
  justify-content: space-between;
  background-color: #fdffff;
  .left {
    height: 100vh;
    width: 55vw;
    background-image: url('../assets/logo_bg.png');
    background-repeat: no-repeat;
    background-size: 100% 100%;
    .left-content {
      position: absolute;
      left: 60px;
      top: 45px;
      img {
        height: 60px;
      }
      span {
        font-size: 18px;
        font-weight: bold;
        color: white;
        margin-left: 18px;
      }
    }
  }
  .right {
    height: 100vh;
    width: 45vw;
    background-color: #fdffff;
    .window-menu {
      -webkit-user-drag: drag;
      height: 40px;
      margin-right: 30px;
      background-color: #fdffff;
    }
  }
}
</style>
