let MediaRouters = [
  {
    path: '/media-info',
    name: 'media-info',
    component: () => import('../../views/Media/MediaInfo.vue')
  },
  {
    path: '/media-video',
    name: 'media-video',
    component: () => import('../../views/Media/MediaVideo.vue')
  }
]

export {
  MediaRouters
}
