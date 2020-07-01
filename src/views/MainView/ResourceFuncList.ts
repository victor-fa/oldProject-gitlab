interface ResourceFuncItem {
  icon: any,
  command: string,
  iconWidth: string,
  title: string,
  selectedIcon?: any,
  isHidden?: boolean,
  isSelected?: boolean
}

const searchItem: ResourceFuncItem = { icon: require('../../assets/search_icon.png'), command: 'search', iconWidth: '20px', title: '搜索' }
const refreshItem: ResourceFuncItem = { icon: require('../../assets/refresh_icon.png'), command: 'refresh', iconWidth: '20px', title: '刷新' }

const commonFuncList: ResourceFuncItem[] = [
  searchItem,
  refreshItem,
  { icon: require('../../assets/sort_icon.png'), command: 'sort', iconWidth: '20px', title: '排序' },
  { icon: require('../../assets/arrange_icon.png'), command: 'arrange', iconWidth: '20px', selectedIcon: require('../../assets/block_icon.png'), title: '排列' }
]

const customFuncList: ResourceFuncItem[] = [
  searchItem,
  refreshItem,
  { icon: require('../../assets/new_custom.png'), command: 'newCustom', iconWidth: '20px', title: '新建' }
]

const storageFuncList: ResourceFuncItem[] = [searchItem, refreshItem]

export {
  searchItem,
  ResourceFuncItem,
  commonFuncList,
  customFuncList,
  storageFuncList
}
