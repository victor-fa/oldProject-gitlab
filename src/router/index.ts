import _ from 'lodash'
import Vue from 'vue'
import VueRouter from 'vue-router'
import LoginLayout from '../layouts/LoginLayout.vue'
import { HomeRouters } from './modules/HomeList'
import { LoginRouters } from './modules/LoginList'
import { MediaRouters } from './modules/MediaList'
import { SettingRouters } from './modules/SettingList'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'login-layout',
    component: LoginLayout,
    children: [
      ...LoginRouters
    ]
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../layouts/BaseLayout.vue'),
    children: [
      ...HomeRouters
    ]
  },
  {
    path: '/system-setting',
    name: 'system-setting',
    component: () => import('../layouts/SettingLayout.vue'),
    children: [
      ...SettingRouters
    ]
  },
  {
    path: '/info',
    name: 'DiskInfo',
    component: () => import('../views/Disk/DiskInfo.vue')
  },
  {
    path: '/media-layout',
    name: 'media-layout',
    component: () => import('../layouts/MediaLayout.vue'),
    children: [
      ...MediaRouters
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
  {
    path: '/disk-msg',
    name: 'MessageWindow',
    component: () => import('../views/Disk/MessageWindow.vue')
  },
  {
    path: '/disk-about',
    name: 'DiskAbout',
    component: () => import('../views/Disk/DiskAbout.vue')
  },
  {
    path: '/disk-feedback',
    name: 'DiskFeedBack',
    component: () => import('../views/Disk/DiskFeedBack.vue')
  },
  {
    path: '/forget-pass',
    name: 'DiskForgetPass',
    component: () => import('../views/Disk/DiskForgetPass.vue')
  },
  {
    path: '/disk-account',
    name: 'DiskAccount',
    component: () => import('../views/Disk/DiskAccount.vue')
  },
  {
    path: '/disk-setting',
    name: 'DiskSetting',
    component: () => import('../views/Disk/DiskSetting.vue')
  }
]

const router = new VueRouter({
  // mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
