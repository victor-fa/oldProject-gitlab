import _ from 'lodash'
import { NasAccessInfo, NasInfo } from '../../api/ClientModel'
import { NAS_INFO, NAS_ACCESS } from '../../common/constants'
import { ActionContext } from 'vuex'

interface NasServerState {
  nasInfo?: NasInfo,
  accessInfo?: NasAccessInfo
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
    },
    accessInfo: (state: NasServerState) => {
      if (!_.isEmpty(state.accessInfo)) {
        return state.accessInfo
      }
      const accessJson = localStorage.getItem(NAS_ACCESS)
      if (accessJson !== null) {
        return JSON.parse(accessJson)
      }
      return {}
    }
  },
  mutations: {
    UPDATE_NAS_INFO (state: NasServerState, nasInfo: NasInfo) {
      state.nasInfo = nasInfo
      localStorage.setItem(NAS_INFO, JSON.stringify(nasInfo))
    },
    UPDATE_NAS_ACCESS (state: NasServerState, nasAccess: NasAccessInfo) {
      state.accessInfo = nasAccess
      localStorage.setItem(NAS_ACCESS, JSON.stringify(nasAccess))
    },
    CLEAR_CACHE_NAS (state: NasServerState) {
      state.nasInfo = undefined
      localStorage.removeItem(NAS_INFO)
      state.accessInfo = undefined
      localStorage.removeItem(NAS_ACCESS)
    }
  },
  actions: {
    async updateNasInfo (context: ActionContext<NasServerState, NasServerState>, nasInfo: NasInfo) {
      context.commit('UPDATE_NAS_INFO', nasInfo)
    },
    async updateNasAccess (context: ActionContext<NasServerState, NasServerState>, nasAccess: NasAccessInfo) {
      context.commit('UPDATE_NAS_ACCESS', nasAccess)
    },
    async clearCacheNas (context: ActionContext<NasServerState, NasServerState>) {
      context.commit('CLEAR_CACHE_NAS')
    }
  }
}
