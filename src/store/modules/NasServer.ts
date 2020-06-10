import _ from 'lodash'
import { NasAccessInfo, NasInfo, CryptoInfo } from '../../api/ClientModel'
import { NAS_INFO, NAS_ACCESS, CRYPTO_INFO } from '../../common/constants'
import { ActionContext } from 'vuex'

interface NasServerState {
  nasInfo?: NasInfo,
  accessInfo?: NasAccessInfo
  cryptoInfo?: CryptoInfo
}

export default {
  namespaced: true,
  state: {
    nasInfo: {},
    accessInfo: {},
    cryptoInfo: {}
  },
  getters: {
    nasInfo: (state: NasServerState) => {
      if (!_.isEmpty(state.nasInfo)) {
        return state.nasInfo
      }
      const nasJson = localStorage.getItem(NAS_INFO)
      if (nasJson !== null) {
        state.nasInfo = JSON.parse(nasJson)
        return state.nasInfo
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
    },
    cryptoInfo: (state: NasServerState) => {
      if (!_.isEmpty(state.cryptoInfo)) {
        return state.cryptoInfo
      }
      const cryptoJson = localStorage.getItem(CRYPTO_INFO)
      if (cryptoJson !== null) {
        return JSON.parse(cryptoJson)
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
    UPDATE_CRYPTO_INFO (state: NasServerState, cryptoInfo: CryptoInfo) {
      state.cryptoInfo = cryptoInfo
      localStorage.setItem(CRYPTO_INFO, JSON.stringify(cryptoInfo))
    },
    CLEAR_CACHE_NAS (state: NasServerState) {
      // state.nasInfo = undefined
      // localStorage.removeItem(NAS_INFO)
      state.accessInfo = undefined
      localStorage.removeItem(NAS_ACCESS)
      state.cryptoInfo = undefined
      localStorage.removeItem(CRYPTO_INFO)
    }
  },
  actions: {
    async updateNasInfo (context: ActionContext<NasServerState, NasServerState>, nasInfo: NasInfo) {
      context.commit('UPDATE_NAS_INFO', nasInfo)
    },
    async updateNasAccess (context: ActionContext<NasServerState, NasServerState>, nasAccess: NasAccessInfo) {
      context.commit('UPDATE_NAS_ACCESS', nasAccess)
    },
    async updateCryptoInfo (context: ActionContext<NasServerState, NasServerState>, cryptoInfo: CryptoInfo) {
      context.commit('UPDATE_CRYPTO_INFO', cryptoInfo)
    },
    async clearCacheNas (context: ActionContext<NasServerState, NasServerState>) {
      context.commit('CLEAR_CACHE_NAS')
    }
  }
}
