interface ResourceFuncItem {
  icon: any,
  command: string,
  iconWidth: string,
  selectedIcon?: any,
  isHidden?: boolean,
  isSelected?: boolean
}

const commonFuncList: ResourceFuncItem[] = [
  { icon: require('../../assets/search_icon.png'), command: 'search', iconWidth: '20px' },
  { icon: require('../../assets/refresh_icon.png'), command: 'refresh', iconWidth: '20px' },
  { icon: require('../../assets/sort_icon.png'), command: 'sort', iconWidth: '20px' },
  { icon: require('../../assets/arrange_icon.png'), command: 'arrange', iconWidth: '20px', selectedIcon: require('../../assets/block_icon.png') }
]

const customFuncList: ResourceFuncItem[] = [
  { icon: require('../../assets/search_icon.png'), command: 'search', iconWidth: '20px' },
  { icon: require('../../assets/refresh_icon.png'), command: 'refresh', iconWidth: '20px' },
  { icon: require('../../assets/new_custom.png'), command: 'newCustom', iconWidth: '20px' }
]

const storageFuncList: ResourceFuncItem[] = [
  { icon: require('../../assets/search_icon.png'), command: 'search', iconWidth: '20px' },
  { icon: require('../../assets/refresh_icon.png'), command: 'refresh', iconWidth: '20px' }
]

export {
  ResourceFuncItem,
  commonFuncList,
  customFuncList,
  storageFuncList
}
