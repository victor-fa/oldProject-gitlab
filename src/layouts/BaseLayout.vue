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
		<a-modal title="检测到有新版本固件更新"
			:visible="update.visiable" :mask="false" :closable="false" :maskClosable="false" width="350px"
			okText="确认升级" cancelText="取消升级" @ok="handleUpdate" @cancel="handleCancleUpdate">
			<p>版本名称：{{update.info.versionName}}（{{update.info.size | filterSize}}）</p>
			<p>发布时间：{{update.info.pubtime | filterTime}}</p>
			<p>描述：{{update.info.desc}}</p>
		</a-modal>
  </a-layout>
</template>

<script lang="ts">
import _, { Dictionary } from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import ILogo from '@/components/Logo/index.vue'
import SiderMenu from '@/components/SiderMenu/index.vue'
import BasicHeader from '@/components/BasicHeader/index.vue'
import processCenter, { EventName } from '@/utils/processCenter'
import { HomeRouters, FuncListItem } from '@/router/modules/HomeList'
import { CacheRoute, RouteCalss } from '@/store/modules/Router'
import RouterUtility from '@/utils/RouterUtility'
import { EventBus } from '@/utils/eventBus'
import { ResourceItem } from '@/api/NasFileModel'
import NasFileAPI from '@/api/NasFileAPI'
import { User, DeviceRole } from '@/api/UserModel'
import StringUtility from '@/utils/StringUtility'
import { initQueue, clearQueueCache } from '@/api/Transport/TransportQueue'

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
    ...mapGetters('NasServer', ['accessInfo']),
    silderItems: function() {
      const items = HomeRouters.filter(item => {
        return item.meta !== undefined
      })
      return _.cloneDeep(items)
    }
  },
  filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
		},
    filterTime (time) {
      return StringUtility.formatShowMtime(time)
		}
	},
	data() {
		return {
			update: {
				visiable: false,
				info: {} as any
			},
			diskMode: 0
		};
  },
  created () {
    initQueue()
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
				this.update.info = response.data.data as any
				// this.update.info = {
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
				this.update.visiable = true
			}).catch(error => {
        console.log(error)
      })
		},
		switchDevice () {
			this.$store.dispatch('NasServer/clearCacheNas')
			clearQueueCache()
			processCenter.renderSend(EventName.bindList)
		},
		handleUpdate () {
			NasFileAPI.fetchRomUpgrade().then(response => {
				if (response.data.code !== 200) return
        console.log(response);
				this.$message.success('请等待几分钟重新连接，请勿关闭电源')
        setTimeout(() => {
          this.switchDevice()
        }, 3000);
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
    },
    handleCancleUpdate() {
      this.update = {
				visiable: false,
				info: {} as any
      }
    },
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
