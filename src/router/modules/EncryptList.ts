const encryptRouters = [
  {
    path: '/activate-view',
    name: 'activate-view',
    component: () => import('../../views/Encrypt/ActivateView/index.vue')
  },
  {
    path: '/encrypt-login',
    name: 'encrypt-login',
    component: () => import('../../views/Encrypt/LoginView/index.vue')
  },
  {
    path: '/open-error',
    name: 'open-error',
    component: () => import('../../views/Encrypt/SyncPassword/OpenError.vue')
  },
  {
    path: '/disk-password',
    name: 'disk-password',
    component: () => import('../../views/Encrypt/SyncPassword/DiskPassword.vue')
  },
  {
    path: '/sync-password',
    name: 'sync-password',
    component: () => import('../../views/Encrypt/SyncPassword/index.vue')
  },
  {
    path: '/encrypt-resource-view',
    name: 'encrypt-resource-view',
    component: () => import('../../views/Encrypt/EncryptResourceView.vue')
  },
]

export {
  encryptRouters
}
