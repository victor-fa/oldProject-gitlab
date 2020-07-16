<template>
  <div class="open-error-style">
    <div class="open-error-content">
      <img src="../../../assets/sync_error_icon.png">
      <span class="error-title">加密空间打开失败</span>
      <span class="error-desc">可能是接入了其他绿联云设备使用过的硬盘，需要输入硬盘原来的加密空间密码进行加密数据同步。</span>
      <a-button class="next-btn" @click="handleNextAction">下一步</a-button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'open-error',
  methods: {
    handleNextAction () {
      this.$router.push({
        path: 'disk-password',
        query: { 'diskLocaltion': 'first' }
      })
    }
  }
})
</script>

<style lang="less" scoped>
.open-error-style {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  .open-error-content {
    width: 320px;
    margin-top: 108px;
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
      width: 90px;
    }
    .error-title {
      margin-top: 34px;
      font-size: 14px;
      line-height: 21px;
      color: black;
      font-weight: bold;
    }
    .error-desc {
      margin-top: 23px;
      font-size: 14px;
      color: black;
      line-height: 26px;
      text-align: left;
    }
    .next-btn {
      margin-top: 34px;
      width: 180px;
      height: 46px;
      border-radius: 23px;
      font-size: 18px;
    }
  }
}
</style>
