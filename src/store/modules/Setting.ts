import _ from 'lodash'
import { CloseChoiceInfo, AutoPowerOnInfo, AutoLoginInfo } from '../../api/SettingModel'
import { CLOSE_CHOICE, AUTO_POWER_ON, AUTO_LOGIN } from '../../common/constants'
import { ActionContext } from 'vuex'

interface SettingState {
  closeInfo?: CloseChoiceInfo,
  autoPowerOn?: AutoPowerOnInfo,
  autoLogin?: AutoLoginInfo,
}

export default {
  namespaced: true,
  state: {
    closeInfo: {},
    autoPowerOn: {},
    autoLogin: {}
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
      return {}
    },
    autoPowerOn: (state: SettingState) => {
      if (!_.isEmpty(state.autoPowerOn)) {
        return state.autoPowerOn
      }
      const autoPowerOnJson = localStorage.getItem(AUTO_POWER_ON)
      if (autoPowerOnJson !== null) {
        state.autoPowerOn = JSON.parse(autoPowerOnJson)
        return state.autoPowerOn
      }
      return {}
    },
    autoLogin: (state: SettingState) => {
      if (!_.isEmpty(state.autoLogin)) {
        return state.autoLogin
      }
      const autoLoginJson = localStorage.getItem(AUTO_LOGIN)
      if (autoLoginJson !== null) {
        state.autoLogin = JSON.parse(autoLoginJson)
        return state.autoLogin
      }
      return {}
    },
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
    },
    UPDATE_AUTO_POWER_ON (state: SettingState, autoPowerOn: AutoPowerOnInfo) {
      state.autoPowerOn = autoPowerOn
      const json = JSON.stringify(autoPowerOn)
      localStorage.setItem(AUTO_POWER_ON, json)
    },
    UPDATE_AUTO_LOGIN (state: SettingState, autoLogin: AutoLoginInfo) {
      state.autoLogin = autoLogin
      const json = JSON.stringify(autoLogin)
      localStorage.setItem(AUTO_LOGIN, json)
    }
  },
  actions: {
    async updateCloseChoiceInfo (context: ActionContext<SettingState, SettingState>, closeInfo: CloseChoiceInfo) {
      context.commit('UPDATE_CLOSE_CHOICE', closeInfo)
    },
    async clearCloseChoiceInfo (context: ActionContext<SettingState, SettingState>) {
      context.commit('CLEAR_CLOSE_CHOICE')
    },
    async updateAutoPowerOnInfo (context: ActionContext<SettingState, SettingState>, autoPowerOnInfo: AutoPowerOnInfo) {
      context.commit('UPDATE_AUTO_POWER_ON', autoPowerOnInfo)
    },
    async updateAutoLoginInfo (context: ActionContext<SettingState, SettingState>, autoLoginInfo: AutoLoginInfo) {
      context.commit('UPDATE_AUTO_LOGIN', autoLoginInfo)
    }
  }
}
