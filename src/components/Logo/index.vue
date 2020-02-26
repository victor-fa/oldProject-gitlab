<template>
  <div class="logo" @click="logoClicked">
    <img src="../../assets/logo.png"/>
    <div class="logo-detail">
      <label class="logo-name">绿联云</label>
      <label class="logo-tip">www.ugreen.com</label>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'logo',
  methods: {
    logoClicked: (event: MouseWheelEvent) => {
      console.log(event)
    }
  }
})
</script>

<style lang="less" scoped>
.logo {
  height: 90px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  img {
    height: 42px;
    margin-left: 27px;
  }
  .logo-detail {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-left: 10px;
    .logo-name {
      font-size: 16px;
      font-weight: bold;
      color: #484848;
      text-align: left;
      margin-top: 3px;
    }
    .logo-tip {
      font-size: 12px;
      color: #484848;
      text-align: left;
      margin-bottom: 4px;
    }
  }
}
</style>
