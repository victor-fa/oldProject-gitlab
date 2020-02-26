import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    directory: '网盘'
  },
  getters: {
    getCurrentDirectory: (state) => {
      return state.directory
    }
  },
  mutations: {
    pushPathFunc (state, path: string) {
      state.directory += ('/' + path)
    },
    popPathFunc (state) {
      const length = state.directory.lastIndexOf('/')
      state.directory = state.directory.substring(0, length)
    }
  },
  actions: {
    pushPath (context, path: string) {
      context.commit('pushPathFunc', path)
    },
    popPath (context) {
      context.commit('popPathFunc')
    }
  },
  modules: {
  }
})
