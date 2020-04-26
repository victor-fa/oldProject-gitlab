import { ActionContext } from 'vuex'

interface LoginState {
  connectionErrorCount: number
}

export default {
  namespaced: true,
  state: {
    connectionErrorCount: 0 // 连接设备报网络错误次数
  },
  getters: {
    connectionErrorCount: (state: LoginState) => {
      return state.connectionErrorCount
    }
  },
  mutations: {
    UPDATE_ERROR_COUNT (state: LoginState, count: number) {
      state.connectionErrorCount = count
    },
  },
  actions: {
    updateErrorCount (context: ActionContext<LoginState, LoginState>, count: number) {
      context.commit('UPDATE_ERROR_COUNT', count)
    }
  }
}
