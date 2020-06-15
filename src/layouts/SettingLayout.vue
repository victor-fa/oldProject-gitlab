<template>
  <a-layout class="settting-layout">
    <a-layout-header class="setting-header">
      <span><img class="setting-icon" src="../assets/setting_icon.png">&nbsp;&nbsp;系统设置</span>
      <window-menu :configure="'unable'" class="window-menu"/>
    </a-layout-header>
    <a-layout>
      <a-layout-sider class="setting-sider">
        <div
          v-for="(item, index) in siderMenu"
          :key="index"
          class="sider-item"
          v-show="!item.disable"
          v-bind:class="{ 'sider-item-selected': item.meta.isSelected }"
          @click="handleSiderItemClick(index)"
        >
          {{ item.meta.title }}
        </div>
      </a-layout-sider>
      <a-layout-content class="setting-content">
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { NasInfo } from '@/api/ClientModel'
import WindowMenu from '@/components/WindowMenu/index.vue'
import { SettingRouters } from '@/router/modules/SettingList'
import { DeviceRole } from '@/api/UserModel'

export default Vue.extend({
  name: 'setting-layout',
  components: {
    WindowMenu
  },
	computed: {
		...mapGetters('NasServer', ['accessInfo'])
	},
  data () {
    return {
      siderMenu: [] as any,
    }
  },
  mounted () {
    if (this.$route.name !== 'user-profile') this.$router.push('user-profile')
    SettingRouters[4].disable = this.accessInfo.role === DeviceRole.user
    const items = SettingRouters.filter(item => {
      return item.meta !== undefined
    })
    this.siderMenu = _.cloneDeep(items)
  },
  methods: {
    handleSiderItemClick (index: number) {
      const item = this.siderMenu[index]
      if (item.meta.isSelected === true) return
      this.siderMenu = this.siderMenu.map((item, aIndex) => {
        item.meta.isSelected = aIndex === index
        return item
      })
      this.$router.push(item.name)
    }
  }
})
</script>

<style lang="less" scoped>
.settting-layout {
  width: 100vw;
  height: 100vh;
  .setting-header {
    height: 35px;
    width: 100%;
    padding: 0px;
    background-color: #EDEFF4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    -webkit-app-region: drag;
    img {
      width: 20px;
    }
    span {
      margin-left: 20px;
      font-weight: 500;
    }
    .window-menu {
      margin-right: 20px;
    }
  }
  .setting-sider {
    width: 120px !important;
    min-width: 120px !important;
    max-width: 120px !important;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
    flex-direction: column;
    background-color: #F8F9FC;
    .sider-item {
      height: 44px;
      line-height: 44px;
      font-size: 14px;
      font-weight: 500;
      color: #484848;
      margin-top: 10px;
    }
    .sider-item-selected {
      background-color: #06b6501a;
      color: #007934;
      font-weight: 500;
    }
  }
  .setting-content {
    padding: 0px;
    background: #fff;
    height: 100%;
  }
}
</style>
