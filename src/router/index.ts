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
    path: '/connecting',
    name: 'connecting',
    component: () => import('../views/Connecting/index.vue')
  },
  // {
  //   path: '/home',
  //   name: 'home',
  //   component: () => import('../layouts/BaseLayout.vue'),
  //   children: [
  //     ...HomeRouters
  //   ]
  // },
  {
    path: '/disk',
    name: 'disk',
    component: () => import('../views/Disk/index.vue'),
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
  },
  {
    path: '/picture-shower',
    name: 'DiskPictureShower',
    component: () => import('../views/Disk/DiskPictureShower.vue')
  },
  {
    path: '/file-shower',
    name: 'DiskFileContent',
    component: () => import('../views/Disk/DiskFileContent.vue')
  },
  {
    path: '/video-player',
    name: 'DiskVideoPlayer',
    component: () => import('../views/Disk/DiskVideoPlayer.vue')
  },
  {
    path: '/pdf-viewer',
    name: 'DiskPdfView',
    component: () => import('../views/Disk/DiskPdfView.vue')
  },
  {
    path: '/music-player',
    name: 'DiskMusicPlayer',
    component: () => import('../views/Disk/DiskMusicPlayer.vue')
  },
]

const router = new VueRouter({
  // mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
