interface OperateItem {
  title: string,
  icon?: any,
  command: string,
  disable?: boolean, // 根据不同状态确定是否可用
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
      { title: '打开', command: 'open' }
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

const recentContextMenu: Array<OperateGroup> = [
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
    ]
  },
  {
    items: [
      { title: '初始化', command: 'initialize' },
      { title: '属性', command: 'info' }
    ]
  }
]

const encryptResourceContextMenu: Array<OperateGroup> = [
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
    items: [
      { title: '复制', command: 'copy' },
      { title: '剪切', command: 'cut' }
    ]
  },
  {
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '移出空间', command: 'moveout' },
      { title: '属性', command: 'info' }
    ]
  }
]

const encryptMisTokenContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '登录空间', command: 'loginEncrypt' },
      { title: '重置空间', command: 'reset' }
    ]
  }
]

const encryptContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '上传', command: 'upload' },
      { title: '刷新', command: 'refresh' },
      { title: '修改密码', command: 'modifyPass' },
      { title: '重置空间', command: 'reset' }
    ]
  }
]

const backupResourceContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '打开', command: 'open' },
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
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '删除', command: 'delete' },
      { title: '复制', command: 'copy' },
      { title: '剪切', command: 'cut' },
      { title: '移动到', command: 'moveto' }
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
      { title: '删除', command: 'delete' },
      { title: '重命名', command: 'rename' },
      { title: '下载', command: 'download' }
    ]
  },
  {
    items: [
      { title: '复制', command: 'copy' },
      { title: '剪切', command: 'cut' }
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

const shareResourceContextMenu: Array<OperateGroup> = [
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
    items: [
      { title: '复制', command: 'copy' },
      { title: '剪切', command: 'cut' }
    ]
  },
  {
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '属性', command: 'info' },
      { title: '到文件位置', command: 'jump' }
    ]
  }
]

const customContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '修改', command: 'modify' },
      { title: '删除', command: 'delete' }
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
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '加密', command: 'encrypt' },
      { title: '属性', command: 'info' }
    ]
  }
]
const customListContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '新建', command: 'newCustom' }
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

const listContextMenu: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '上传', command: 'upload' },
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

if (process.platform === 'win32') {
  listContextMenu[0].items[0].childrens = [
    { title: '上传文件', command: 'uploadFile' },
    { title: '上传文件夹', command: 'uploadFolder' }
  ]
  encryptContextMenu[0].items[0].childrens = [
    { title: '上传文件', command: 'uploadFile' },
    { title: '上传文件夹', command: 'uploadFolder' }
  ]
}

const recycleContextMenu: OperateGroup[] = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '还原', command: 'recovery' },
      { title: '删除', command: 'delete' },
      { title: '重命名', command: 'rename', disable: true },
      { title: '属性', command: 'info' }
    ]
  }
]

const recycleListContextMenu: OperateGroup[] = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '清空回收站', command: 'clearTrash' },
      { title: '刷新', command: 'refresh' },
      { title: '属性', command: 'info' }
    ]
  }
]

export {
  resourceContextMenu,
  recentContextMenu,
  storageContextMenu,
  encryptResourceContextMenu,
  encryptMisTokenContextMenu,
  encryptContextMenu,
  backupResourceContextMenu,
  collectContextMenu,
  shareContextMenu,
  shareResourceContextMenu,
  customContextMenu,
  customListContextMenu,
  listContextMenu,
  recycleContextMenu,
  recycleListContextMenu,
  OperateItem,
  OperateGroup
}
