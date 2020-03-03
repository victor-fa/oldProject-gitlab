import { ActionContext } from 'vuex'

interface ResourceState {
  directory: string
}

export default {
  namespaced: true,
  state: {
    directory: '网盘'
  },
  getters: {
    directory: (state: ResourceState) => {
      return state.directory
    }
  },
  mutations: {
    PUSH_PATH (state: ResourceState, path: string) {
      state.directory += ('/' + path)
    },
    POP_PATH (state: ResourceState) {
      const length = state.directory.lastIndexOf('/')
      state.directory = state.directory.substring(0, length)
    }
  },
  actions: {
    pushPath (context: ActionContext<ResourceState, ResourceState>, path: string) {
      context.commit('PUSH_PATH', path)
    },
    popPath (context: ActionContext<ResourceState, ResourceState>) {
      context.commit('POP_PATH')
    }
  }
}
