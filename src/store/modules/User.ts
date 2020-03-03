import _ from 'lodash'
import { AccessToken, User } from '../../api/UserModel'
import { ActionContext } from 'vuex'
import { USER_MODEL, ACCESS_TOKEN } from '../../common/constants'

interface UserState {
  user: User,
  accessToken: AccessToken
}

export default {
  state: {
    user: {},
    accessToken: {}
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
    }
  },
  actions: {
    async updateUser (context: ActionContext<UserState, UserState>, user: User) {
      context.commit('UPDATE_USER', user)
    },
    async updateAccessToken (context: ActionContext<UserState, UserState>, token: AccessToken) {
      context.commit('UPDATE_ACCESS_TOKEN', token)
    }
  }
}
