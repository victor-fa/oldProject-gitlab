<template>
  <a-config-provider :locale="zh_CN">
    <div id="app">
      <keep-alive>
        <router-view />
      </keep-alive>
      <basic-model
        :title="basicModel.title"
        :content="basicModel.content"
        :loading="basicModel.loading"
        :leftButton="basicModel.leftButton"
        :type="basicModel.type"
        v-if="basicModel.visiable"
        v-on:dismiss="basicModel.visiable = false"
        v-on:confirm="handleBasicConfirm"/>
    </div>
  </a-config-provider>
</template>

<script lang="ts">
import Vue from 'vue'
import { EventBus, EventType } from './utils/eventBus'
import zh_CN from 'ant-design-vue/lib/locale-provider/zh_CN'
import moment from 'moment'
import 'moment/locale/zh-cn'
import router from '@/router'
import BasicModel from '@/components/BasicModel/index.vue'
import { hasLoginWindow } from '@/api/NasServer'
import processCenter, { EventName } from '@/utils/processCenter'

moment.locale('zh-cn')
export default Vue.extend({
  name: 'app',
  components: {
    BasicModel
  },
  data () {
    return {
      zh_CN,
      basicModel: {
        visiable: false,
        title: '',
        content: '',
        leftButton: '',
        loading: false
      }
    }
  },
  mounted () {
    EventBus.$on(EventType.showToast, (msg: string) => {
      this.$message.error(msg)
    })
    EventBus.$on(EventType.showDialog, () => {
      this.basicModel = {
        visiable: true,
        title: '绿联云',
        content: '您的帐号在另一设备登录，已被迫下线。如非您本人操作，那么您的密码有可能已泄露，建议您修改密码',
        leftButton: '好的',
        loading: false
      }
    })
  },
  destroyed () {
    EventBus.$off(EventType.showToast)
    EventBus.$off(EventType.showDialog)
  },
  methods: {
    handleBasicConfirm () {
      hasLoginWindow() ? router.replace('login') : processCenter.renderSend(EventName.login)
    }
  }
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
