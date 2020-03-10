import _ from 'lodash'
import Vue from 'vue'
import VueRouter from 'vue-router'
import Launch from '../views/Launch/index.vue'
import { HomeRouters } from './modules/HomeList'
import { LoginRouters } from './modules/LoginList'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'launch',
    component: Launch
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../layouts/BaseLayout.vue'),
    redirect: '/recent',
    children: [
      ...HomeRouters
    ]
  },
  {
    path: '/login-layout',
    component: () => import('../layouts/LoginLayout.vue'),
    name: 'login-layout',
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

export default router
