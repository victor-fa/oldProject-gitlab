const LoginRouters = [
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
    path: '/account',
    name: 'account',
    component: () => import('../../views/Account/index.vue')
  }
]

export {
  LoginRouters
}
