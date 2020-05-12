interface ResourceFuncItem {
  icon: any,
  command: string,
  iconWidth: string,
  selectedIcon?: any,
  isHidden?: boolean
}

const commonFuncList: ResourceFuncItem[] = [
  { icon: require('../../assets/search_icon.png'), command: 'search', iconWidth: '13px' },
  { icon: require('../../assets/refresh_icon.png'), command: 'refresh', iconWidth: '12px' },
  { icon: require('../../assets/sort_icon.png'), command: 'sort', iconWidth: '14px' },
  { icon: require('../../assets/arrange_icon.png'), command: 'arrange', iconWidth: '14px', selectedIcon: require('../../assets/arrange_hor_icon.png') }
]

const customFuncList: ResourceFuncItem[] = [
  { icon: require('../../assets/search_icon.png'), command: 'search', iconWidth: '13px' },
  { icon: require('../../assets/refresh_icon.png'), command: 'refresh', iconWidth: '12px' },
  { icon: require('../../assets/new_custom.png'), command: 'newCustom', iconWidth: '15px' }
]

export {
  ResourceFuncItem,
  commonFuncList,
  customFuncList
}
