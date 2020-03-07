import _ from 'lodash'
import Vue from 'vue'
import VueRouter from 'vue-router'
import BaseLayout from '../layouts/BaseLayout.vue'
import { HomeRouters } from './modules/HomeList'
import { LoginRouters } from './modules/LoginList'
import processCenter, { MainEventName } from '../utils/processCenter'
import { USER_MODEL, ACCESS_TOKEN } from '../common/constants'
import { AccessToken } from '../api/UserModel'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'index',
    redirect: (to: any) => {
      const result = validatorToken()
      if (result === true) {
        return '/recent'
      } else {
        showToast(result)
        return '/login-layout'
      }
    },
    component: BaseLayout,
    children: [
      ...HomeRouters
    ]
  },
  {
    path: '/login-layout',
    component: () => import('../layouts/LoginLayout.vue'),
    name: 'login-layout',
    redirect: '/login',
    children: [
      ...LoginRouters
    ]
  }
]

const router = new VueRouter({
  // mode: 'history',
  base: process.env.BASE_URL,
  routes
})

const validatorToken = () => {
  const userJson = localStorage.getItem(USER_MODEL)
  const tokenJson = localStorage.getItem(ACCESS_TOKEN)
  if (userJson === null || tokenJson === null) {
    return false
  }
  const timestamp = new Date().getDate() / 1000
  const token = JSON.parse(tokenJson) as AccessToken
  if (timestamp > token.expires_time) {
    return 'token过期，请重新登录'
  }
  return true
}

const showToast = (toast: boolean | string) => {
  if (_.isBoolean(toast)) return
  const { BrowserWindow } = require('electron').remote
  const win = BrowserWindow.getFocusedWindow()
  if (win !== null) {
    processCenter.mainSend(win, MainEventName.toast, toast)
  }
}

export default router
