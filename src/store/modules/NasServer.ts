import _ from 'lodash'
import { NasLoginResponse } from '../../api/ClientModel'
import { NAS_INFO } from '../../common/constants'
import { nasServer } from '@/utils/request'
import { ActionContext } from 'vuex'

interface NasServerState {
  nasInfo: NasLoginResponse
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
    UPDATE_NAS_INFO (state: NasServerState, nasInfo: NasLoginResponse) {
      state.nasInfo = nasInfo
      localStorage.setItem(NAS_INFO, JSON.stringify(nasInfo))
    }
  },
  actions: {
    async updateNasInfo (context: ActionContext<NasServerState, NasServerState>, nasInfo: NasLoginResponse) {
      context.commit('UPDATE_NAS_INFO', nasInfo)
    }
  }
}
