import _ from 'lodash'
import { AccessToken, User, Account } from '../../api/UserModel'
import { ActionContext } from 'vuex'
import { USER_MODEL, ACCESS_TOKEN, ACCOUNT } from '../../common/constants'

interface UserState {
  user?: User,
  accessToken?: AccessToken,
  cacheAccounts: Array<Account>
}

export default {
  namespaced: true,
  state: {
    user: {},
    accessToken: {},
    cacheAccounts: []
  },
  getters: {
    user: (state: UserState) => {
      if (!_.isEmpty(state.user)) {
        return state.user
      }
      const userJson = localStorage.getItem(USER_MODEL)
      if (userJson !== null) {
        return JSON.parse(userJson)
      }
      return {}
    },
    accessToken: (state: UserState) => {
      if (!_.isEmpty(state.accessToken)) {
        return state.accessToken
      }
      const tokenJson = localStorage.getItem(ACCESS_TOKEN)
      if (tokenJson !== null) {
        return JSON.parse(tokenJson)
      }
      return {}
    },
    cacheAccounts: (state: UserState) => {
      if (!_.isEmpty(state.cacheAccounts)) {
        return state.cacheAccounts
      }
      const accountStr = localStorage.getItem(ACCOUNT)
      if (accountStr !== null && accountStr.length > 0) {
        return accountStr.split(',')
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
    },
    ADD_ACCOUNT (state: UserState, account: Account) {
      state.cacheAccounts.push(account)
      const accountStr = state.cacheAccounts.toString()
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
    }
  }
}
