import _, { Dictionary } from 'lodash';
import router from '@/router';
import store from '@/store'
import { CacheRoute, RouteClass } from '../store/modules/Router'

export default {
  push (name: string, path: string, query?: Dictionary<string>, params?: Dictionary<string>) {
    store.dispatch('Router/push', { name, path, query, params })
    router.push({
      name: path,
      query: query,
      params: params
    })
  },
  pop (index?: number) {
    store.dispatch('Router/pop', index).then(() => {
      this.jumpLastRoute()
    })
  },
  popTop () {
    const showRoutes = _.get(store.getters, 'Router/showRoutes') as CacheRoute[]
    if (showRoutes.length === 1) return
    store.dispatch('Router/popTop').then(() => {
      this.jumpLastRoute()
    })
  },
  switchRoute (type: RouteClass) {
    store.dispatch('Router/switchshowRoutes', type).then(() => {
      this.jumpLastRoute()
    })
    this.releaseEncryptRouters()
  },
  updateRoutes (routers: CacheRoute[]) {
    store.dispatch('Router/updateshowRoutes', routers).then(() => {
      this.jumpLastRoute()
    })
  },
  jumpLastRoute () {
    const showPaths = _.get(store.getters, 'Router/showRoutes') as CacheRoute[]
    const lastPath = _.last(showPaths) as CacheRoute
    router.replace({
      name: lastPath.path,
      query: lastPath.query,
      params: lastPath.params
    })
  },
  releaseEncryptRouters () {
    store.dispatch('Router/releaseEncryptRouters')
  }
}
