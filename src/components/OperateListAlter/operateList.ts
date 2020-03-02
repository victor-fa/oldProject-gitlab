interface OperateItem {
  title: string,
  icon?: any,
  subItems?: any
}

interface OperateGroup {
  icon?: any,
  items: Array<OperateItem>
}

const operateList: Array<OperateGroup> = [
  {
    icon: require('../../assets/open_accessory.png'),
    items: [
      { title: '打开' }, { title: '打开方式' }
    ]
  },
  {
    icon: require('../../assets/down_accessory.png'),
    items: [
      { title: '下载' }, { title: '分享' }
    ]
  },
  {
    items: [
      { title: '复制' }, { title: '剪切' }, { title: '移动到' }
    ]
  },
  {
    icon: require('../../assets/delet_accessory.png'),
    items: [
      { title: '删除' }, { title: '重命名' }, { title: '属性' }
    ]
  }
]

export {
  operateList
}
