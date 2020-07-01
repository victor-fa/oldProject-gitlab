<template>
  <div class="storage-progress">
    <a-layout-header class="setting-header">
      <span>磁盘正在初始化</span>
    </a-layout-header>
    <div class="content">
      <div class="top">
        <span class="title">磁盘正在初始化,请勿拔电源，关机</span>
        <span class="number">50%</span>
      </div>
      <a-progress class="progress" :percent="50" :show-info="false" :stroke-color="'#2CD18A'" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'storage-progress',
})
</script>

<style lang="less" scoped>
.storage-progress {
  width: 100vw;
  .setting-header {
    height: 35px;
    width: 100%;
    padding: 0px;
    background-color: #EDEFF4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    -webkit-app-region: no-drag;
    img { width: 20px; }
    span {
      margin-left: 20px;
      font-weight: 500;
    }
    .window-menu { margin-right: 20px; }
  }
  .content {
    padding: 45px 40px;
    .top {
      display: flex;
      margin-bottom: 15px;
      .title {
        font-weight: 500;
        font-size: 14px;
      }
      .number {
        flex: 1;
        text-align: right;
        font-size: 30px;
        font-weight: 500;
        line-height: 11px;
      }
    }
    .progress {

    }
  }
}
</style>
