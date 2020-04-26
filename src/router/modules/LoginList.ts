const LoginRouters = [
  {
    path: '/launch',
    name: 'launch',
    component: () => import('../../views/Launch/index.vue')
  },
  {
    path: '/connecting',
    name: 'connecting',
    component: () => import('../../views/Connecting/index.vue')
  },
  {
    path: '/connection-failed',
    name: 'connection-failed',
    component: () => import('../../views/Connecting/ConnectionFailed.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../../views/Login/index.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../../views/Register/index.vue')
  },
  {
    path: '/qr-code-login',
    name: 'qr-code-login',
    component: () => import('../../views/QRCodeLogin/index.vue')
  },
  {
    path: '/scan-nas',
    name: 'scan-nas',
    component: () => import('../../views/ScanNas/index.vue')
  },
  {
    path: '/bind-device-list',
    name: 'bind-device-list',
    component: () => import('../../views/BindNasList/index.vue')
  }
]

export {
  LoginRouters
}
