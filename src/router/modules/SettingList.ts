const SettingRouters = [
  {
    path: '/user-profile',
    name: 'user-profile',
    component: () => import('../../views/SystemSetting/Profile/index.vue'),
    meta: {
      title: '我的账号',
      isSelected: true
    }
  },
  {
    path: '/common-setting',
    name: 'common-setting',
    component: () => import('../../views/SystemSetting/Common/index.vue'),
    meta: {
      title: '通用设置',
      isSelected: false
    }
  },
  {
    path: '/user-manager',
    name: 'user-manager',
    component: () => import('../../views/SystemSetting/UserManager/index.vue'),
    meta: {
      title: '用户管理',
      isSelected: false
    }
  },
  {
    path: '/nas-info',
    name: 'nas-info',
    component: () => import('../../views/SystemSetting/NasInfo/index.vue'),
    meta: { 
      title: '设备信息',
      isSelected: false 
    }
  },
  {
    path: '/local-account',
    name: 'local-account',
    component: () => import('../../views/SystemSetting/LocalAccount/index.vue'),
    meta: { 
      title: '本地账号',
      isSelected: false
    }
  }
]

export {
  SettingRouters
}
