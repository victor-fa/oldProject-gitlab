interface OperateItem {
  title: string,
  icon?: any,
  subItems?: any,
  command?: string
}

interface OperateGroup {
  icon?: any,
  items: Array<OperateItem>
}

const operateList: Array<OperateGroup> = [
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
      { title: '分享', command: 'share' }
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

export {
  operateList
}
