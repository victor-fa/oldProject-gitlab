interface OperateItem {
  title: string,
  icon?: any,
  subItems?: any,
  command: string,
  disable?: boolean,
  hide?: boolean
}

interface OperateGroup {
  icon?: any,
  items: Array<OperateItem>
}

const itemoOperateList: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '打开', command: 'open' },
      { title: '打开方式', command: 'openMode' }
    ]
  },
  {
    icon: require('../../assets/down_accessory.png'),
    items: [
      { title: '下载', command: 'download' },
      { title: '分享', command: 'share' },
      { title: '取消分享', command: 'unshare', hide: true },
      { title: '收藏', command: 'collect' },
      { title: '取消收藏', command: 'uncollect', hide: true }
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
      { title: '属性', command: 'info' }
    ]
  }
]

const operateList: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '上传文件', command: 'upload' },
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

export {
  itemoOperateList,
  operateList,
  OperateItem,
  OperateGroup
}
