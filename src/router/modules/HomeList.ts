import { TransportRouters } from './TransportList'
import { BackupRouters } from './BackupList'

const HomeRouters = [
  {
    path: '/recent',
    component: () => import('../../views/Recent/index.vue'),
    name: 'recent',
    meta: {
      title: '最近上传',
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
      title: '全部文件',
      icon: require('../../assets/storage_icon.png'),
      selectedIcon: require('../../assets/storage_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/media/image',
    name: 'media-image',
    component: () => import('../../views/Media/index.vue'),
    meta: { 
      title: '图片',
      isSelected: false
     }
  },
  {
    path: '/media/video',
    name: 'media-video',
    component: () => import('../../views/Media/index.vue'),
    meta: { 
      title: '视频',
      isSelected: false
     }
  },
  {
    path: '/media/music',
    name: 'media-music',
    component: () => import('../../views/Media/index.vue'),
    meta: { 
      title: '音乐',
      isSelected: false
     }
  },
  {
    path: '/media/document',
    name: 'media-document',
    component: () => import('../../views/Media/index.vue'),
    meta: { 
      title: '文档',
      isSelected: false
     }
  },
  {
    path: '/custom',
    component: () => import('../../views/Custom/index.vue'),
    name: 'custom',
    meta: {
      title: '我的珍藏',
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
      title: '我的收藏',
      icon: require('../../assets/collect_icon.png'),
      selectedIcon: require('../../assets/collect_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/backup',
    component: () => import('../../views/Backup/index.vue'),
    name: 'backup',
    meta: {
      title: '我的备份',
      icon: require('../../assets/backup_icon.png'),
      selectedIcon: require('../../assets/backup_icon_selected.png'),
      isSelected: false
    },
    children: [
      ...BackupRouters
    ]
  },
  {
    path: '/share',
    component: () => import('../../views/Share/index.vue'),
    name: 'share',
    meta: {
      title: '共享空间',
      icon: require('../../assets/share_icon.png'),
      selectedIcon: require('../../assets/share_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/encrypt',
    component: () => import('../../views/Encrypt/index.vue'),
    name: 'encrypt',
    meta: {
      title: '加密空间',
      icon: require('../../assets/encrypt_icon.png'),
      selectedIcon: require('../../assets/encrypt_icon_selected.png'),
      isSelected: false
    }
  },
  {
    path: '/transport',
    component: () => import('../../views/Transport/index.vue'),
    name: 'transport',
    meta: {
      title: '任务列表',
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
      icon: require('../../assets/recycle_icon.png'),
      selectedIcon: require('../../assets/recycle_icon_selected.png'),
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
    path: '/encrypt-resource-view',
    name: 'encrypt-resource-view',
    component: () => import('../../views/Encrypt/EncryptResourceView.vue')
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
    isSelected: boolean,
  }
}

export {
  HomeRouters,
  FuncListItem
}
