import _ from 'lodash'
import { NasAccessInfo } from '../../api/ClientModel'
import { NAS_INFO } from '../../common/constants'
import { ActionContext } from 'vuex'

interface NasServerState {
  nasInfo: NasAccessInfo
}

export default {
  namespaced: true,
  state: {
    nasInfo: {}
  },
  getters: {
    nsaInfo: (state: NasServerState) => {
      if (!_.isEmpty(state.nasInfo)) {
        return state.nasInfo
      }
      const nasJson = localStorage.getItem(NAS_INFO)
      if (nasJson !== null) {
        return JSON.parse(nasJson)
      }
      return {}
    }
  },
  mutations: {
    UPDATE_NAS_INFO (state: NasServerState, nasInfo: NasAccessInfo) {
      state.nasInfo = nasInfo
      localStorage.setItem(NAS_INFO, JSON.stringify(nasInfo))
    }
  },
  actions: {
    async updateNasInfo (context: ActionContext<NasServerState, NasServerState>, nasInfo: NasAccessInfo) {
      context.commit('UPDATE_NAS_INFO', nasInfo)
    }
  }
}
