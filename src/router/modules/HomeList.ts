import { TransportRouters } from './TransportList'

const HomeRouters = [
  {
    path: '/recent',
    component: () => import('../../views/Recent/index.vue'),
    name: 'recent',
    meta: {
      title: '最近',
      icon: require('../../assets/recent_icon.png'),
      selectedIcon: require('../../assets/recent_icon_selected.png'),
      isSelected: true
    }
  },
  {
    path: '/storage',
    component: () => import('../../views/Storage/index.vue'),
    name: 'storage',
    meta: {
      title: '存储',
      icon: require('../../assets/storage_icon.png'),
      selectedIcon: require('../../assets/storage_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/custom',
    component: () => import('../../views/Custom/index.vue'),
    name: 'custom',
    meta: {
      title: '精选',
      icon: require('../../assets/custom_icon.png'),
      selectedIcon: require('../../assets/custom_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/collect',
    component: () => import('../../views/Collect/index.vue'),
    name: 'collect',
    meta: {
      title: '收藏',
      icon: require('../../assets/collect_icon.png'),
      selectedIcon: require('../../assets/collect_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/encrypt',
    component: () => import('../../views/Encrypt/index.vue'),
    name: 'encrypt',
    meta: {
      title: '加密',
      icon: require('../../assets/encrypt_icon.png'),
      selectedIcon: require('../../assets/encrypt_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/backup',
    component: () => import('../../views/Backup/index.vue'),
    name: 'backup',
    meta: {
      title: '备份',
      icon: require('../../assets/backup_icon.png'),
      selectedIcon: require('../../assets/backup_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/share',
    component: () => import('../../views/Share/index.vue'),
    name: 'share',
    meta: {
      title: '分享',
      icon: require('../../assets/share_icon.png'),
      selectedIcon: require('../../assets/share_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/transport',
    component: () => import('../../views/Transport/index.vue'),
    name: 'transport',
    meta: {
      title: '任务',
      icon: require('../../assets/transport_icon.png'),
      selectedIcon: require('../../assets/transport_icon_selected.png'),
      isSelected: false
    },
    children: [
      ...TransportRouters
    ]
  },
  {
    path: '/recycle',
    name: 'recycle',
    component: () => import('../../views/Recycle/index.vue'),
    meta: {
      title: '回收站',
      icon: require('../../assets/transport_icon.png'),
      selectedIcon: require('../../assets/transport_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/main-resource-view',
    name: 'main-resource-view',
    component: () => import('../../views/MainView/MainResourceView.vue')
  },
  {
    path: '/recent-resource-view',
    name: 'recent-resource-view',
    component: () => import('../../views/Recent/RecentResourceView.vue')
  },
  {
    path: '/collect-resource-view',
    name: 'collect-resource-view',
    component: () => import('../../views/Collect/CollectResourceView.vue')
  },
  {
    path: '/share-resource-view',
    name: 'share-resource-view',
    component: () => import('../../views/Share/ShareResourceView.vue')
  },
  {
    path: '/share-file-page',
    name: 'share-file-page',
    component: () => import('../../views/Share/ShareFilePage.vue')
  },
  {
    path: '/storage-partitions',
    name: 'storage-partitions',
    component: () => import('../../views/Storage/StoragePartitions.vue')
  },
 {
   path: '/recycle-resource-view',
   name: 'recycle-resource-view',
   component: () => import('../../views/Recycle/RecycleResourceView.vue')
 } 
]

interface FuncListItem {
  path: string,
  name: string,
  meta?: {
    title: string,
    icon: any,
    selectedIcon: any,
    isSelected: boolean
  }
}

export {
  HomeRouters,
  FuncListItem
}
