import { ActionContext } from 'vuex'
import { StorageInfo } from '@/api/NasFileModel'

interface ResourceState {
  directory: string,
  storages: Array<StorageInfo>,
  showItemCount: number
}

export default {
  namespaced: true,
  state: {
    directory: '网盘',
    storages: [],
    showItemCount: 0
  },
  getters: {
    directory: (state: ResourceState) => {
      return state.directory
    },
    storages: (state: ResourceState) => {
      return state.storages
    },
    showItemCount: (state: ResourceState) => {
      return state.showItemCount
    }
  },
  mutations: {
    PUSH_PATH (state: ResourceState, path: string) {
      state.directory += `/${path}`
    },
    POP_PATH (state: ResourceState) {
      const length = state.directory.lastIndexOf('/')
      state.directory = state.directory.substring(0, length)
    },
    UPDATE_STORAGES (state: ResourceState, storages: Array<StorageInfo>) {
      state.storages = storages
    },
    UPDATE_SHOW_ITEM_COUNT (state: ResourceState, count: number) {
      state.showItemCount = count
    }
  },
  actions: {
    pushPath (context: ActionContext<ResourceState, ResourceState>, path: string) {
      context.commit('PUSH_PATH', path)
    },
    popPath (context: ActionContext<ResourceState, ResourceState>) {
      context.commit('POP_PATH')
    },
    updateStorages (context: ActionContext<ResourceState, ResourceState>) {
      context.commit('UPDATE_STORAGES')
    },
    updateShowItemCount (context: ActionContext<ResourceState, ResourceState>, count: number) {
      context.commit('UPDATE_SHOW_ITEM_COUNT', count)
    }
  }
}
