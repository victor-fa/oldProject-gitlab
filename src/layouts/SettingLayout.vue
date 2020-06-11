<template>
  <a-layout class="settting-layout">
    <a-layout-header class="setting-header">
      <span>系统设置</span>
      <window-menu :configure="'unable'" class="window-menu"/>
    </a-layout-header>
    <a-layout>
      <a-layout-sider class="setting-sider">
        <div
          v-for="(item, index) in siderMenu"
          :key="index"
          class="sider-item"
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
import WindowMenu from '@/components/WindowMenu/index.vue'
import { SettingRouters } from '@/router/modules/SettingList'

export default Vue.extend({
  name: 'setting-layout',
  components: {
    WindowMenu
  },
  data () {
    const items = SettingRouters.filter(item => {
      return item.meta !== undefined
    })
    return {
      siderMenu: _.cloneDeep(items)
    }
  },
  mounted () {
    if (this.$route.name !== 'user-profile') this.$router.push('user-profile')
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
    height: 44px;
    width: 100%;
    padding: 0px;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    -webkit-app-region: drag;
    span {
      margin-left: 20px;
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
    background-color: white;
    .sider-item {
      height: 44px;
      line-height: 44px;
      font-size: 14px;
      font-weight: bold;
      color: #484848;
    }
    .sider-item-selected {
      background-color: #DEF1EA;
      color: #007934;
    }
  }
  .setting-content {
    padding: 0px;
    background: #fff;
    height: 100%;
  }
}
</style>
