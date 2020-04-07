const TransportRouters = [
  {
    path: '/download',
    name: 'download',
    component: () => import('../../views/Transport/SubPages/DownloadList.vue')
  },
  {
    path: '/upload',
    name: 'upload',
    component: () => import('../../views/Transport/SubPages/UploadList.vue')
  },
  {
    path: '/offline',
    name: 'offline',
    component: () => import('../../views/Transport/SubPages/OfflineList.vue')
  },
  {
    path: '/backup-list',
    name: 'backup-list',
    component: () => import('../../views/Transport/SubPages/BackupList.vue')
  },
  {
    path: '/remote',
    name: 'remote',
    component: () => import('../../views/Transport/SubPages/RemoteList.vue')
  }
]

export {
  TransportRouters
}
