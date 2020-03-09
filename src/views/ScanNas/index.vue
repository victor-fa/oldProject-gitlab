<template>
  <div class="scan-nas">
    <h3>scan-nas</h3>
    <p>你还没有绑定设备，局域网扫描中</p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ClientAPI from '../../api/ClientAPI'

export default Vue.extend({
  name: 'scan-nas',
  mounted () {
    console.log('begin scan')
    ClientAPI.scanNas(data => {
      console.log(data)
      // 1. 授权码连接
      // 2. 在线登录
      // 3. 直接连接，管理员绑定
    }, error => {
      console.log(error)
    })
  }
})
</script>

<style lang="less" scoped>
.scan-nas {
  color: black;
}
</style>
