interface OperateItem {
  title: string,
  icon?: any,
  subItems?: any,
  commend?: string
}

interface OperateGroup {
  icon?: any,
  items: Array<OperateItem>
}

const transportList: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '打开', commend: 'open' },
      { title: '打开方式', commend: 'openMode' }
    ]
  },
  {
    icon: require('../../assets/down_accessory.png'),
    items: [
      { title: '下载', commend: 'download' },
      { title: '分享', commend: 'share' }
    ]
  },
  {
    items: [
      { title: '复制', commend: 'copy' },
      { title: '剪切', commend: 'cut' },
      { title: '移动到', commend: 'moveto' }
    ]
  },
  {
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '删除', commend: 'delete' },
      { title: '重命名', commend: 'rename' },
      { title: '属性', commend: 'info' }
    ]
  }
]

export {
  transportList
}
