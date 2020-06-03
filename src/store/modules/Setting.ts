import _ from 'lodash'
import { CloseChoiceInfo } from '../../api/SettingModel'
import { CLOSE_CHOICE } from '../../common/constants'
import { ActionContext } from 'vuex'

interface SettingState {
  closeInfo?: CloseChoiceInfo,
}

export default {
  namespaced: true,
  state: {
    closeInfo: []
  },
  getters: {
    closeInfo: (state: SettingState) => {
      if (!_.isEmpty(state.closeInfo)) {
        return state.closeInfo
      }
      const closeJson = localStorage.getItem(CLOSE_CHOICE)
      if (closeJson !== null) {
        state.closeInfo = JSON.parse(closeJson)
        return state.closeInfo
      }
      return []
    }
  },
  mutations: {
    UPDATE_CLOSE_CHOICE (state: SettingState, closeInfo: CloseChoiceInfo) {
      state.closeInfo = closeInfo
      const json = JSON.stringify(closeInfo)
      localStorage.setItem(CLOSE_CHOICE, json)
    },
    CLEAR_CLOSE_CHOICE (state: SettingState) {
      state.closeInfo = undefined
      localStorage.removeItem(CLOSE_CHOICE)
    }
  },
  actions: {
    async updateCloseChoiceInfo (context: ActionContext<SettingState, SettingState>, closeInfo: CloseChoiceInfo) {
      context.commit('UPDATE_CLOSE_CHOICE', closeInfo)
    },
    async clearCloseChoiceInfo (context: ActionContext<SettingState, SettingState>) {
      context.commit('CLEAR_CLOSE_CHOICE')
    }
  }
}
