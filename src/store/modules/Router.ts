import _, { Dictionary } from 'lodash'
import { ActionContext } from 'vuex'

enum RouteClass {
  recent = 'recent',
  storage = 'storage',
  image = 'media-image',
  video = 'media-video',
  music = 'media-music',
  document = 'media-document',
  custom = 'custom',
  collect = 'collect',
  encrypt = 'encrypt',
  backup = 'backup',
  share = 'share'
}

interface CacheRoute {
  name: string,
  path: string,
  hide?: boolean, // 隐藏菜单，不在导航栏中显示
  query?: Dictionary<string>,
  params?: Dictionary<string>,
  type?: RouteClass // 内部只读参数，用于区分一级菜单分类，栈顶缓存才拥有此参数
}

export {
  RouteClass,
  CacheRoute
}

interface RouterState {
  showRoutes: CacheRoute[],
  pathMap: Map<string, CacheRoute[]>
}

export default {
  namespaced: true,
  state: {
    showRoutes: [],
    pathMap: {}
  },
  getters: {
    showRoutes: (state: RouterState) => {
      return state.showRoutes
    }
  },
  mutations: {
    INIT_PATHS (state: RouterState, pathsMap: Map<string, CacheRoute[]>) {
      state.pathMap = pathsMap
      state.showRoutes = pathsMap[RouteClass.recent]
    },
    SWITCH_SHOW_PATHS (state: RouterState, type: RouteClass) {
      const paths = state.pathMap[type] as CacheRoute[]
      state.showRoutes = paths
    },
    UPDATE_SHOW_PATHS (state: RouterState, paths: CacheRoute[]) {
      const route = _.head(paths)
      if (route === undefined) return
      const type = route.type
      if (type === undefined) return
      state.pathMap[type] = paths
      state.showRoutes = paths
    },
    PUSH (state: RouterState, item: CacheRoute) {
      const type = getCacheType(state)
      if (type === undefined) return
      const paths = _.clone(state.pathMap[type] as CacheRoute[])
      paths.push(item)
      state.pathMap[type] = paths
      state.showRoutes = paths
    },
    POP (state: RouterState, index?: number) {
      const type = getCacheType(state)
      if (type === undefined) return
      let paths = _.clone(state.pathMap[type] as CacheRoute[])
      if (index === undefined) {
        paths.pop()
      } else {
        paths = paths.slice(0, index + 1)
      }
      state.pathMap[type] = paths
      state.showRoutes = paths
    },
    POP_TOP (state: RouterState) {
      const type = getCacheType(state)
      if (type === undefined) return
      const routes = state.showRoutes.filter((item, index) => {
        return index === 0
      })
      state.pathMap[type] = routes
      state.showRoutes = routes
    },
    REPLACE_PATHS (state: RouterState, length: number) {
      const start = 1
      const paths = _.cloneDeep(state.showRoutes)
      paths.splice(start + 1, length)
      paths[start].name = '...'
      state.showRoutes = paths
    },
    RELEASE_ENCRYPT_ROUTERS (state: RouterState) {
      const routers = state.pathMap[RouteClass.encrypt] as CacheRoute[]
      state.pathMap[RouteClass.encrypt] = routers.slice(0, 1)
    }
  },
  actions: {
    initPaths (context: ActionContext<RouterState, RouterState>, pathsMap: Map<string, CacheRoute[]>) {
      context.commit('INIT_PATHS', pathsMap)
    },
    switchshowRoutes (context: ActionContext<RouterState, RouterState>, type: RouteClass) {
      context.commit('SWITCH_SHOW_PATHS', type)
    },
    updateshowRoutes (context: ActionContext<RouterState, RouterState>, paths: CacheRoute[]) {
      context.commit('UPDATE_SHOW_PATHS', paths)
    },
    push (context: ActionContext<RouterState, RouterState>, item: CacheRoute) {
      context.commit('PUSH', item)
    },
    pop (context: ActionContext<RouterState, RouterState>, index?: number) {
      context.commit('POP', index)
    },
    popTop (context: ActionContext<RouterState, RouterState>) {
      context.commit('POP_TOP')
    },
    replacePaths (context: ActionContext<RouterState, RouterState>, length: number) {
      context.commit('REPLACE_PATHS', length)
    },
    releaseEncryptRouters (context: ActionContext<RouterState, RouterState>) {
      context.commit('RELEASE_ENCRYPT_ROUTERS')
    }
  }
}

const getCacheType = (state: RouterState) => {
  const firstPath = _.head(state.showRoutes)
  if (firstPath === undefined) return undefined
  return firstPath.type
}
