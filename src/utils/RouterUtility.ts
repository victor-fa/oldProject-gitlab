import _, { Dictionary } from 'lodash';
import router from '@/router';
import store from '@/store';
import { CacheRoute, RouteCalss } from '../store/modules/Paths'

export default {
  push (name: string, path: string, query?: Dictionary<string>, params?: Dictionary<string>) {
    store.dispatch('Paths/push', { name, path, query, params })
    router.push({
      name: path,
      query: query,
      params: params
    })
  },
  /**pop到指定的路由 */
  popSpecifiedRoute (index: number) {
    let showPaths = _.get(store.getters, 'Paths/showPaths') as CacheRoute[]
    showPaths = showPaths.slice(0, index + 1)
    store.dispatch('Paths/updateShowPaths', showPaths).then(() => {
      this.jumpLastRoute()
    })
  },
  popRoute () {
    const showPaths = _.get(store.getters, 'Paths/showPaths') as CacheRoute[]
    let newPaths = _.clone(showPaths) 
    newPaths.pop()
    store.dispatch('Paths/updateShowPaths', newPaths).then(() => {
      this.jumpLastRoute()
    })
  },
  switchRoute (type: RouteCalss) {
    store.dispatch('Paths/switchShowPaths', type).then(() => {
      this.jumpLastRoute()
    })
  },
  updateRoutes (routers: CacheRoute[]) {
    store.dispatch('Paths/updateShowPaths', routers).then(() => {
      this.jumpLastRoute()
    })
  },
  jumpLastRoute () {
    const showPaths = _.get(store.getters, 'Paths/showPaths') as CacheRoute[]
    const lastPath = _.last(showPaths) as CacheRoute
    router.replace({
      name: lastPath.path,
      query: lastPath.query,
      params: lastPath.params
    })
  }
}
