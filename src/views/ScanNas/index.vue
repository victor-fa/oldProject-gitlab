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
    ClientAPI.scanNas().then(reponse => {
      console.log(reponse)
    }).catch(error => {
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
