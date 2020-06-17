<template>
  <a-layout>
    <a-layout-sider class="base-sider">
      <i-logo/>
      <sider-menu
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
import { HomeRouters, FuncListItem } from '../router/modules/HomeList'
import { CacheRoute, RouteClass } from '../store/modules/Router'
import RouterUtility from '../utils/RouterUtility'
import { EventBus } from '../utils/eventBus'
import { ResourceItem } from '../api/NasFileModel'
import { User, DeviceRole } from '../api/UserModel'
import StringUtility from '../utils/StringUtility'
import NasFileAPI from '../api/NasFileAPI'
import processCenter, { EventName } from '@/utils/processCenter'
import TransportHelper from '../api/Transport/TransportHelper'

export default Vue.extend({
  name: 'base-layout',
  components: {
    ILogo,
    SiderMenu,
    BasicHeader
  },
  data () {
    return {
      silderItems: [] as FuncListItem[]
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    ...mapGetters('Resource', ['taskCount']),
    ...mapGetters('NasServer', ['accessInfo'])
  },
  created () {
    TransportHelper.initTransportQueue()
    this.accessInfo.role === DeviceRole.admin ? this.fetchUpdateInfo() : null
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
      const items = HomeRouters.filter(item => {
          return item.meta !== undefined
      })
      this.silderItems = _.cloneDeep(items) as FuncListItem[]
      let pathsMap: Dictionary<CacheRoute[]> = {}
      this.silderItems.forEach(item => {
        const route: CacheRoute = {
          name: item.meta!.title,
          type: item.name as RouteClass,
          path: item.name
        }
        pathsMap[item.name] = [route] 
      })
      this.$store.dispatch('Router/initPaths', pathsMap)
    },
    handleSilderChange (index: number) {
      const item = this.silderItems[index]
      RouterUtility.switchRoute(item.name as RouteClass)
    },
    handlePopTopAction (index: number) {
      RouterUtility.popTop()
    },
    jumpSpecifiedPath (item: ResourceItem) {
      const components = item.path.split('/')
      const category = components.indexOf('.library') !== -1 ? RouteClass.custom : RouteClass.storage
      this.updateSilderMenu(category)
      this.updateContentView(category, item.path, item.uuid)
    },
    updateSilderMenu (category: RouteClass) {
      this.silderItems = this.silderItems.map(item => {
        item.meta!.isSelected = item.name === category
        return item
      })
    },
    updateContentView (category: RouteClass, path: string, uuid: string) {
      const dir = StringUtility.pathDirectory(path)
      let routes: CacheRoute[] = []
      if (category === RouteClass.storage) {
        routes = this.calculateStorageRoutes(dir, uuid)
      } else {
        routes = this.calculateCustomRoutes(dir, uuid)
      }
      const lastRoute = _.last(routes) as CacheRoute
      lastRoute.params = { selectedPath: path }
      RouterUtility.updateRoutes(routes)
    },
    // 计算存储路由集合
    calculateStorageRoutes (path: string, uuid: string) {
      const ugreenNo = (this.user as User).ugreenNo
      let prefix = `/.ugreen_nas/${ugreenNo}`
      const isInternal = _.startsWith(path, prefix)
      if (!isInternal) prefix = '/'
      const directory = path.substring(prefix.length, path.length)
      let components = directory.split('/')
      if (components[0].length !== 0) components.unshift('')
      let cacheRoutes = [this.getFirstRoute(RouteClass.storage)]
      const diskName = isInternal ? '内置硬盘' : '外置硬盘'
      components.forEach((item, index) => {
        const name = item.length === 0 ? diskName : item
        const path = prefix + this.spliceMiddleComponent(components, index)
        cacheRoutes.push({
          name,
          path: 'main-resource-view',
          query: { path, uuid }
        })
      })
      return cacheRoutes
    },
    // 计算自定义路由集合
    calculateCustomRoutes (path: string, uuid: string) {
      const ugreenNo = (this.user as User).ugreenNo
      const prefix = `/.ugreen_nas/${ugreenNo}/.library`
      const directory = path.substring(prefix.length, path.length)
      const components = directory.split('/')
      return components.map((item, index) => {
        if (index === 0) return this.getFirstRoute(RouteClass.custom)
        const path = prefix + this.spliceMiddleComponent(components, index)
        const selectedPath = path
        return {
          name: item,
          path: 'main-resource-view',
          query: { path, uuid }
        }
      })
    },
    // 拼接指定中间目录
    spliceMiddleComponent (components: string[], aIndex: number) {
      let path = ''
      for (let index = 1; index <= aIndex; index++) {
        const element = components[index]
        path += `/${element}`
      }
      return path
    },
    getStorageCache (): CacheRoute[] {
      const item = this.silderItems[1]
      return [{
        name: item.meta!.title,
        path: item.name,
        type: RouteClass.storage
      }]
    },
		fetchUpdateInfo () {
			NasFileAPI.fetchRomInfo().then(response => {
				if (response.data.code !== 200) {
					this.$message.error('网络连接错误，请检测网络')
					return
				}
				if (!response.data.data) {
					return
        }
        const info = response.data.data as any
        // const info = {
        //   "id": 36,
        //   "model": "2",
        //   "modelName": "PRO_V001_SN01.0.1.002",
        //   "name": "NasServer固件_内网升级_V01.02.33.200308",
        //   "versionNo": "10233200308",
        //   "versionName": "内测固件",
        //   "size": 1.0,
        //   "desc": "Nas Server升级固件",
        //   "remark": "Nas Server升级固件",
        //   "pubtime": 1582678312000,
        //   "ctime": 1582678312000,
        //   "utime": 1583452793000
        // } as any
        const _this = this as any
        _this.$ipc.send('system', 'rom-update', info);
			}).catch(error => {
        console.log(error)
      })
		},
    getFirstRoute (category: RouteClass) {
      let item: FuncListItem | undefined
      for (let index = 0; index < this.silderItems.length; index++) {
        const element = this.silderItems[index]
        if (element.name === category) {
          item = element
          break
        }
      }
      return {
        name: item!.meta!.title,
        path: item!.name,
        type: category
      } as CacheRoute
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
