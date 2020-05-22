import _, { Dictionary } from 'lodash'
import { ActionContext } from 'vuex'

enum RouteCalss {
  recent = 'recent',
  storage = 'storage',
  custom = 'custom',
  collect = 'collect',
  encrypt = 'encrypt',
  backup = 'backup',
  share = 'share'
}

interface CacheRoute {
  name: string,
  path: string,
  query?: Dictionary<string>,
  params?: Dictionary<string>,
  type?: RouteCalss // 内部只读参数，用于区分一级菜单分类，栈顶缓存才拥有此参数
}

export {
  RouteCalss,
  CacheRoute
}

interface PathsState {
  showPaths: CacheRoute[],
  pathMap: {
    recent: CacheRoute[],
    storage: CacheRoute[],
    collect: CacheRoute[],
    encrypt: CacheRoute[],
    backup: CacheRoute[],
    share: CacheRoute[]
  }
}

export default {
  namespaced: true,
  state: {
    showPaths: [],
    pathMap: {
      recent: [],
      storage: [],
      collect: [],
      encrypt: [],
      backup: [],
      share: []
    }
  },
  getters: {
    showPaths: (state: PathsState) => {
      return state.showPaths
    }
  },
  mutations: {
    INIT_PATHS (state: PathsState, pathsMap: Dictionary<CacheRoute[]>) {
      state.pathMap = pathsMap as any
      state.showPaths = pathsMap[RouteCalss.recent]
    },
    SWITCH_SHOW_PATHS (state: PathsState, type: RouteCalss) {
      const paths = state.pathMap[type] as CacheRoute[]
      state.showPaths = paths
    },
    PUSH (state: PathsState, item: CacheRoute) {
      const type = getCacheType(state)
      if (type === undefined) return
      const paths = _.clone(state.pathMap[type] as CacheRoute[])
      paths.push(item)
      state.pathMap[type] = paths
      state.showPaths = paths
    },
    POP (state: PathsState, index: number) {
      const type = getCacheType(state)
      if (type === undefined) return
      let paths = _.clone(state.pathMap[type] as CacheRoute[])
      paths = paths.slice(0, index + 1)
      state.pathMap[type] = paths
      state.showPaths = paths
    },
    UPDATE_SHOW_PATHS (state: PathsState, paths: CacheRoute[]) {
      const type = getCacheType(state)
      if (type === undefined) return
      state.pathMap[type] = paths
      state.showPaths = paths
    }
  },
  actions: {
    initPaths (context: ActionContext<PathsState, PathsState>, pathsMap: Dictionary<CacheRoute[]>) {
      context.commit('INIT_PATHS', pathsMap)
    },
    switchShowPaths (context: ActionContext<PathsState, PathsState>, type: RouteCalss) {
      context.commit('SWITCH_SHOW_PATHS', type)
    },
    push (context: ActionContext<PathsState, PathsState>, item: CacheRoute) {
      context.commit('PUSH', item)
    },
    pop (context: ActionContext<PathsState, PathsState>, index: number) {
      context.commit('POP', index)
    },
    updateShowPaths (context: ActionContext<PathsState, PathsState>, paths: CacheRoute[]) {
      context.commit('UPDATE_SHOW_PATHS', paths)
    }
  }
}

const getCacheType = (state: PathsState) => {
  const firstPath = _.head(state.showPaths)
  if (firstPath === undefined) return undefined
  return firstPath.type
}
