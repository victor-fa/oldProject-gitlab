<template>
  <a-layout class="base-layout">
    <a-layout-header class="base-status-bar">
      <basic-header/>
    </a-layout-header>
    <a-layout class="base-content">
      <a-layout-sider class="base-sider">
        <sider-menu
          :taskCount="taskCount"
          :silderItems="silderItems"
          v-on:change="handleSilderChange"
          v-on:popTop="handlePopTopAction"
        />
      </a-layout-sider>
      <a-layout-content>
        <router-view/>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
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
import StorageHandler from '../views/Storage/StorageHandler'
import UserAPI from '../api/UserAPI'

const packageInfo = require('../../package')

export default Vue.extend({
  name: 'base-layout',
  components: {
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
    this.fetchStorages()
  },
  mounted () {
    this.filterSilderItems()
    this.initCacheRoutes()
    this.checkSoftUpdate()
    EventBus.$on(EventName.jump, this.jumpSpecifiedPath)
    if (this.$route.path !== '/recent') this.$router.push('recent')
  },
  destroyed () {
    EventBus.$off(EventName.jump, this.jumpSpecifiedPath)
  },
  methods: {
    filterSilderItems () {
      const items = HomeRouters.filter(item => {
          return item.meta !== undefined
      })
      this.silderItems = _.cloneDeep(items) as FuncListItem[]
    },
    initCacheRoutes () {
      let pathsMap: Map<string, CacheRoute[]> = new Map()
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
    // 调接口判断是否需要更新
    checkSoftUpdate () {
      let appId = ''
      let appVersion = 0
      if (process.platform === 'win32') {	// win环境
        appId = packageInfo.winAppId
        appVersion = packageInfo.winAppVersion
      } else {	// mac环境
        appId = packageInfo.macAppId
        appVersion = packageInfo.macAppVersion
      }
      UserAPI.fetchSoftVerUpdateInfo(appId, appVersion).then(response => {
        if (response.data.code !== 200) return
        if (response.data.data !== null) {
          const verNo = _.get(response.data.data, 'verNo')
          if (Number(verNo) > appVersion) { // 当版本号超过，则更新
            processCenter.renderSend(EventName.update)
          }
        }
      }).catch(error => {
        console.log(error)
      })
    },
    handleSilderChange (index: number) {
      const item = this.silderItems[index]
      RouterUtility.switchRoute(item.name as RouteClass)
      this.silderItems = this.silderItems.map((item, aIndex) => {
        item.meta!.isSelected = aIndex === index
        return item
      })
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
    fetchStorages () {
      NasFileAPI.fetchStorages().then(response => {
        console.log(response)
        if (response.data.code !== 200) return
        const storages = _.get(response.data.data, 'storages')
        const list = StorageHandler.formatStorages(storages)
        this.$store.dispatch('Resource/updateStorages', list)
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
		fetchUpdateInfo () {
			NasFileAPI.fetchRomInfo().then(response => {
        console.log(response)
				if (response.data.code !== 200) return
        const info = _.get(response.data, 'data')
				if (!info) return
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
.base-layout {
  height: 100vh;
  .base-status-bar {
    height: 62px;
    padding: 0px;
    background-color: #EDEFF4;
    border-bottom: 1px solid #BCC0CE40;
  }
  .base-content {
    background-color: #f6f8fb;
    border-top: 1px solid white;
    .base-sider {
      width: 170px !important;
      min-width: 170px !important;
      max-width: 170px !important;
      background-color: #edf1f0;
    }
  }
}
</style>
