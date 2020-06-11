import _ from 'lodash'
import { AccessToken, User, Account, DeviceInfo } from '@/api/UserModel'
import { ActionContext } from 'vuex'
import { USER_MODEL, ACCESS_TOKEN, ACCOUNT, NAS_DEVICES } from '@/common/constants'

interface UserState {
  user?: User,
  accessToken?: AccessToken,
  cacheAccounts: Array<Account>,
  nasDevices: DeviceInfo[]
}

export default {
  namespaced: true,
  state: {
    user: {},
    accessToken: {},
    cacheAccounts: [],
    nasDevices: []
  },
  getters: {
    user: (state: UserState) => {
      if (!_.isEmpty(state.user)) {
        return state.user
      }
      const userJson = localStorage.getItem(USER_MODEL)
      if (userJson !== null) {
        state.user = JSON.parse(userJson)
        return state.user
      }
      return {}
    },
    accessToken: (state: UserState) => {
      if (!_.isEmpty(state.accessToken)) {
        return state.accessToken
      }
      const tokenJson = localStorage.getItem(ACCESS_TOKEN)
      if (tokenJson !== null) {
        state.accessToken = JSON.parse(tokenJson)
        return state.accessToken
      }
      return {}
    },
    cacheAccounts: (state: UserState) => {
      if (!_.isEmpty(state.cacheAccounts)) {
        return state.cacheAccounts
      }
      const accountStr = localStorage.getItem(ACCOUNT)
      if (accountStr !== null && accountStr.length > 0) {
        state.cacheAccounts = JSON.parse(accountStr)
        return state.cacheAccounts
      }
      return []
    },
    nasDevices: (state: UserState) => {
      if (!_.isEmpty(state.nasDevices)) {
        return state.nasDevices
      }
      const json = localStorage.getItem(NAS_DEVICES)
      if (!_.isEmpty(json)) {
        state.nasDevices = JSON.parse(json!)
        return state.nasDevices
      }
      return []
    }
  },
  mutations: {
    UPDATE_USER (state: UserState, user: User) {
      state.user = user
      localStorage.setItem(USER_MODEL, JSON.stringify(user))
    },
    UPDATE_ACCESS_TOKEN (state: UserState, token: AccessToken) {
      state.accessToken = token
      localStorage.setItem(ACCESS_TOKEN, JSON.stringify(token))
    },
    CLEAR_CACHE_USERINFO (state: UserState) {
      state.user = undefined
      localStorage.removeItem(USER_MODEL)
      state.accessToken = undefined
      localStorage.removeItem(ACCESS_TOKEN)
      localStorage.removeItem(NAS_DEVICES)
    },
    ADD_ACCOUNT (state: UserState, account: Account) {
      state.cacheAccounts.push(account)
      // array deduplication
      state.cacheAccounts = _.uniqBy(state.cacheAccounts, 'account')
      const accountStr = JSON.stringify(state.cacheAccounts)
      localStorage.setItem(ACCOUNT, accountStr)
    },
    REMOVE_ACCOUNT (state: UserState, account: string) {
      for (let index = 0; index < state.cacheAccounts.length; index++) {
        const element = state.cacheAccounts[index]
        if (element.account === account) {
          state.cacheAccounts.splice(index, 1)
          const accountStr = state.cacheAccounts.toString()
          localStorage.setItem(ACCOUNT, accountStr)
          break
        }
      }
    },
    UPDATE_NAS_DEVICES (state: UserState, devices: DeviceInfo[]) {
      state.nasDevices = devices
      const json = JSON.stringify(devices)
      localStorage.setItem(NAS_DEVICES, json)
    },
    ADD_NAS_DEVICE (state: UserState, device: DeviceInfo) {
      state.nasDevices.push(device)
      // 数组去重
      state.nasDevices = _.uniqBy(state.nasDevices, 'mac')
      const json = JSON.stringify(state.nasDevices)
      localStorage.setItem(NAS_DEVICES, json)
    }
  },
  actions: {
    async updateUser (context: ActionContext<UserState, UserState>, user: User) {
      context.commit('UPDATE_USER', user)
    },
    async updateAccessToken (context: ActionContext<UserState, UserState>, token: AccessToken) {
      context.commit('UPDATE_ACCESS_TOKEN', token)
    },
    async clearCacheUserInfo (context: ActionContext<UserState, UserState>) {
      context.commit('CLEAR_CACHE_USERINFO')
    },
    async addAccount (context: ActionContext<UserState, UserState>, account: Account) {
      context.commit('ADD_ACCOUNT', account)
    },
    async removeAccount (context: ActionContext<UserState, UserState>, account: string) {
      context.commit('REMOVE_ACCOUNT', account)
    },
    async updateNasDevices (context: ActionContext<UserState, UserState>, devices: DeviceInfo[]) {
      context.commit('UPDATE_NAS_DEVICES', devices)
    },
    async addNasDevice (context: ActionContext<UserState, UserState>, device: DeviceInfo) {
      context.commit('ADD_NAS_DEVICE', device)
    }
  }
}
