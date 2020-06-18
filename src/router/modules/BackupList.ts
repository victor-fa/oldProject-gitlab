const BackupRouters = [
  {
    path: '/list',
    name: 'list',
    component: () => import('../../views/Backup/ListPages/index.vue')
  },
  {
    path: '/setting',
    name: 'setting',
    component: () => import('../../views/Transport/SubPages/BackupList.vue')
  }
]

export {
  BackupRouters
}
