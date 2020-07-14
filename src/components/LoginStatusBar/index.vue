<template>
  <div
    class="status-bar"
    style="-webkit-app-region: drag"
    v-bind:class="{ 'darwin-status-bar': isDarwin }"
  >
    <div class="left-bar">
      <img src="../../assets/logo.png">
      <span>绿联云</span>
    </div>
    <div v-if="!isDarwin" class="right-bar">
     <custom-button
        :image="hideIcon"
        iconWidth="20px"
        class="status-item"
        @click.native="hideAction"
      />
     <custom-button
        :image="closeIcon"
        iconWidth="20px"
        class="status-item"
        @click.native="closeAction"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import CustomButton from '../CustomButton/index.vue'

export default Vue.extend({
  name: 'login-status-bar',
  components: {
    CustomButton
  },
  data () {
    return {
      hideIcon: require('../../assets/login_hide_icon.png'),
      closeIcon: require('../../assets/login_close_icon.png')
    }
  },
  computed: {
    isDarwin: function () {
      return process.platform === 'darwin'
    }
  },
  methods: {
    hideAction () {
      const { BrowserWindow } = require('electron').remote
      const win = BrowserWindow.getFocusedWindow()
      if (win !== null) {
        win.minimize()
      }
    },
    closeAction () {
      const { BrowserWindow } = require('electron').remote
      const win = BrowserWindow.getFocusedWindow()
      if (win !== null) {
        win.close()
      }
    }
  }
})
</script>

<style lang="less" scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 55px;
  background-color: white;
  .left-bar {
    display: flex;
    align-items: center;
    img {
      width: 35px;
      margin: 0px 10px 0px 12px;
    }
    span {
      color: #353535;
      font-size: 18px;
    }
  }
  .right-bar {
    padding: 0px 5px;
    display: flex;
    .status-item {
      width: 20px;
      height: 20px;
      margin-right: 8px;
      -webkit-app-region: no-drag;
    }
  }
}
.darwin-status-bar {
  flex-direction: row-reverse;
  .left-bar {
    flex-direction: row-reverse;
  }
}
</style>
