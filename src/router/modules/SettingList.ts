const SettingRouters = [
  {
    path: '/user-profile',
    name: 'user-profile',
    disable: false,
    component: () => import('../../views/SystemSetting/Profile/index.vue'),
    meta: {
      title: '我的帐号',
      isSelected: true
    }
  },
  {
    path: '/common-setting',
    name: 'common-setting',
    disable: false,
    component: () => import('../../views/SystemSetting/Common/index.vue'),
    meta: {
      title: '通用设置',
      isSelected: false
    }
  },
  {
    path: '/user-manager',
    name: 'user-manager',
    disable: false,
    component: () => import('../../views/SystemSetting/UserManager/index.vue'),
    meta: {
      title: '用户管理',
      isSelected: false
    }
  },
  {
    path: '/nas-info',
    name: 'nas-info',
    disable: false,
    component: () => import('../../views/SystemSetting/NasInfo/index.vue'),
    meta: { 
      title: '设备信息',
      isSelected: false 
    }
  },
  {
    path: '/storage-mode',
    name: 'storage-mode',
    disable: false,
    component: () => import('../../views/SystemSetting/StorageMode/index.vue'),
    meta: { 
      title: '存储模式',
      isSelected: false 
    }
  },
  {
    path: '/local-account',
    name: 'local-account',
    disable: false,
    component: () => import('../../views/SystemSetting/LocalAccount/index.vue'),
    meta: { 
      title: '本地帐号',
      isSelected: false
    }
  }
]

export {
  SettingRouters
}
