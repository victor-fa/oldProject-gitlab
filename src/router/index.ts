import Vue from 'vue'
import VueRouter from 'vue-router'
import BaseLayout from '../layouts/BaseLayout.vue'
import { funcListRouters } from './modules/funclist'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'index',
    redirect: '/recent',
    component: BaseLayout,
    children: [
      ...funcListRouters
    ]
  },
  {
    path: '/login-layout',
    component: () => import('../layouts/LoginLayout.vue'),
    name: 'login-layout',
    redirect: '/login',
    children: [
      {
        path: '/login',
        name: 'login',
        component: () => import('../views/Login/index.vue')
      },
      {
        path: '/register',
        name: 'register',
        component: () => import('../views/Register/index.vue')
      }
    ]
  }
]

const router = new VueRouter({
  // mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
