<template>
  <a-locale-provider :locale="zh_CN">
    <div id="app">
      <keep-alive>
        <router-view />
      </keep-alive>
    </div>
  </a-locale-provider>
</template>

<script lang="ts">
import Vue from 'vue'
import { EventBus, EventType } from './utils/eventBus'
import zh_CN from 'ant-design-vue/lib/locale-provider/zh_CN'
import moment from 'moment'
import 'moment/locale/zh-cn'

moment.locale('zh-cn')
export default Vue.extend({
  name: 'app',
  data () {
    return {
      zh_CN
    }
  },
  mounted () {
    EventBus.$on(EventType.showToast, (msg: string) => {
      this.$message.error(msg)
    })
  },
  destroyed () {
    EventBus.$off(EventType.showToast)
  },
})
</script>

<style>
#app {
  font-family: 'PingFangSC-Regular', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  height: 100%;
}
* {
  padding: 0px;
  margin: 0px;
}
img {
  -webkit-user-drag: none;
}
</style>

<style>
@import url('assets/font/icon.css');
</style>
