import deviceMgr from '../../utils/deviceMgr'

interface OperateItem {
  title: string,
  icon?: any,
  command: string,
  disable?: boolean, // 根据不同状态确定是否可用
  enable?: boolean, // 在某些场景下完全禁用该功能
  isHidden?: boolean,
  childrens?: OperateItem[]
}

interface OperateGroup {
  icon?: any,
  items: Array<OperateItem>
}

const resourceContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '打开', command: 'open' },
      { title: '到文件位置', command: 'jump' }
    ]
  },
  {
    icon: require('../../assets/down_accessory.png'),
    items: [
      { title: '下载', command: 'download' },
      { title: '分享', command: 'share' },
      { title: '收藏', command: 'collect' }
    ]
  },
  {
    items: [
      { title: '复制', command: 'copy' },
      { title: '剪切', command: 'cut' },
      { title: '移动到', command: 'moveto' }
    ]
  },
  {
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '删除', command: 'delete' },
      { title: '重命名', command: 'rename' },
      { title: '加密', command: 'encrypt' },
      { title: '属性', command: 'info' }
    ]
  }
]

const storageContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '打开', command: 'open' },
      { title: '重命名', command: 'rename' }
    ]
  },
  {
    items: [
      { title: '卸载', command: 'unload' },
      { title: '格式化', command: 'format' },
      { title: '属性', command: 'info' }
    ]
  }
]

const collectContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '打开', command: 'open' },
      { title: '删除', command: 'delete' },
      { title: '重命名', command: 'rename' },
      { title: '下载', command: 'download' }
    ]
  },
  {
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '取消收藏', command: 'uncollect' },
      { title: '属性', command: 'info' },
      { title: '到文件位置', command: 'jump' }
    ]
  }
]

const shareContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '打开', command: 'open' },
      { title: '复制', command: 'copy' },
      { title: '删除', command: 'delete' },
      { title: '重命名', command: 'rename' },
      { title: '下载', command: 'download' }
    ]
  },
  {
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '取消分享', command: 'unshare' },
      { title: '属性', command: 'info' },
      { title: '到文件位置', command: 'jump' }
    ]
  }
]

let listContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '上传',
        command: 'upload'
      },
      { title: '新建文件夹', command: 'newFolder' }
    ]
  },
  {
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '清空剪切板', command: 'clearClipboard' },
      { title: '粘贴', command: 'paste' },
      { title: '刷新', command: 'refresh' }
    ]
  }
]

if (deviceMgr.getPlatform() === '0') {
  listContextMenu[0].items[0].childrens = [
    { title: '上传文件', command: 'uploadFile' },
    { title: '上传文件夹', command: 'uploadFolder' }
  ]
}

export {
  resourceContextMenu,
  storageContextMenu,
  collectContextMenu,
  shareContextMenu,
  listContextMenu,
  OperateItem,
  OperateGroup
}
