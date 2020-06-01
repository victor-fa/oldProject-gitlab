<template>
  <a-layout>
      <a-layout-sider class="base-sider">
        <i-logo/>
        <sider-menu
          ref="siderMenu"
          :taskCount="taskCount"
          :silderItems="silderItems"
          v-on:change="handleSilderChange"
          v-on:popTop="handlePopTopAction"
        />
      </a-layout-sider>
      <a-layout>
        <a-layout-header class="base-header">
          <basic-header/>
        </a-layout-header>
        <a-layout-content>
          <router-view/>
        </a-layout-content>
      </a-layout>
    </a-layout>
</template>

<script lang="ts">
import _, { Dictionary } from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import ILogo from '../components/Logo/index.vue'
import SiderMenu from '../components/SiderMenu/index.vue'
import BasicHeader from '../components/BasicHeader/index.vue'
import processCenter, { EventName } from '../utils/processCenter'
import { HomeRouters, FuncListItem } from '../router/modules/HomeList'
import { CacheRoute, RouteCalss } from '../store/modules/Router'
import RouterUtility from '../utils/RouterUtility'
import { EventBus } from '../utils/eventBus'
import { ResourceItem } from '../api/NasFileModel'
import { User } from '../api/UserModel'
import StringUtility from '../utils/StringUtility'

export default Vue.extend({
  name: 'base-layout',
  components: {
    ILogo,
    SiderMenu,
    BasicHeader
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('Resource', ['taskCount']),
    silderItems: function() {
      const items = HomeRouters.filter(item => {
        return item.meta !== undefined
      })
      return _.cloneDeep(items)
    }
  },
  mounted () {
    this.initCacheRoutes()
    EventBus.$on(EventName.jump, this.jumpSpecifiedPath)
    if (this.$route.path !== '/recent') this.$router.push('recent')
  },
  destroyed () {
    EventBus.$off(EventName.jump, this.jumpSpecifiedPath)
  },
  methods: {
    initCacheRoutes () {
      let pathsMap: Dictionary<CacheRoute[]> = {}
      this.silderItems.map(item => {
        const route: CacheRoute = {
          name: item.meta!.title,
          type: item.name as RouteCalss,
          path: item.name
        }
        pathsMap[item.name] = [route] 
      })
      this.$store.dispatch('Router/initPaths', pathsMap)
    },
    handleSilderChange (index: number) {
     const item = this.silderItems[index]
     RouterUtility.switchRoute(item.name as RouteCalss)
    },
    handlePopTopAction (index: number) {
      RouterUtility.popTop()
    },
    jumpSpecifiedPath (item: ResourceItem) {
      // update view
      const siderMenu = this.$refs.siderMenu as any
      siderMenu.updateView(1)
      // update route
      const path = StringUtility.pathDirectory(item.path)
      const uuid = item.uuid
      const routes = this.calculateMiddlePath(path, uuid)
      const lastRoute = _.last(routes) as CacheRoute
      lastRoute.params = { selectedPath: item.path }
      RouterUtility.updateRoutes(routes)
    },
    // 计算中间路径缓存
    calculateMiddlePath (path: string, uuid: string) {
      const ugreenNo = (this.user as User).ugreenNo
      let prefix = `/.ugreen_nas/${ugreenNo}`
      const isInternal = _.startsWith(path, prefix)
      if (!isInternal) prefix = '/'
      const directory = path.substring(prefix.length, path.length)
      let components = directory.split('/')
      const diskName = isInternal ? '内置硬盘' : '外置硬盘'
      if (components[0].length !== 0) components.unshift('')
      let cacheRoutes = this.getStorageCache()
      components.forEach((item, index) => {
        const name = item.length === 0 ? diskName : item
        const path = prefix + this.spliceMiddleComponent(components, index)
        const selectedPath = path
        cacheRoutes.push({
          name,
          path: 'main-resource-view',
          query: { path, uuid }
        })
      })
      return cacheRoutes
    },
    // 拼接指定中间目录
    spliceMiddleComponent (components: string[], aIndex: number) {
      let path = ''
      for (let index = 1; index <= aIndex; index++) {
        const element = components[index]
        path += element
      }
      return path
    },
    getStorageCache (): CacheRoute[] {
      const item = this.silderItems[1]
      return [{
        name: item.meta!.title,
        path: item.name,
        type: RouteCalss.storage
      }]
    }
  }
})
</script>

<style lang="scss" scoped>
.base-sider {
  height: 100vh;
  width: 200px;
  background-color: #edf1f0;
}
.base-header {
  height: 32px;
  padding: 0px;
  background-color: white;
}
.base-content {
  padding: 0px;
  background-color: #f6f8fb;
}
</style>
