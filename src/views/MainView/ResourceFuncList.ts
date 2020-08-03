interface ResourceFuncItem {
  icon: any,
  command: string,
  iconWidth: string,
  title: string,
  selectedIcon?: any,
  disableIcon?: any,
  isHidden?: boolean,
  disable?: boolean,
  isSelected?: boolean
}

const searchItem: ResourceFuncItem = { 
  title: '搜索', 
  command: 'search', 
  iconWidth: '16px', 
  icon: require('../../assets/search_icon.png'), 
  disableIcon: require('../../assets/search_disable.png'), 
  selectedIcon: require('../../assets/search_selected.png') 
}
const refreshItem: ResourceFuncItem = { 
  title: '刷新', 
  command: 'refresh', 
  iconWidth: '16px', 
  icon: require('../../assets/refresh_icon.png'), 
  disableIcon: require('../../assets/refresh_disable.png'), 
  selectedIcon: require('../../assets/refresh_selected.png') 
}
const sortDescItem: ResourceFuncItem = { 
  title: '排序', 
  command: 'sort', 
  iconWidth: '16px', 
  icon: require('../../assets/sort_desc_normal.png'), 
  disableIcon: require('../../assets/sort_desc_disable.png'), 
  selectedIcon: require('../../assets/sort_desc_selected.png') 
}
const sortAscItem: ResourceFuncItem = { 
  title: '排序', 
  command: 'sort', 
  iconWidth: '16px', 
  icon: require('../../assets/sort_asc_icon.png'), 
  disableIcon: require('../../assets/sort_asc_disable.png'), 
  selectedIcon: require('../../assets/sort_asc_selected.png') 
}
const arrangeItem: ResourceFuncItem = { 
  title: '排列arrange', 
  command: 'arrange', 
  iconWidth: '16px', 
  icon: require('../../assets/arrange_icon.png'), 
  selectedIcon: require('../../assets/arrange_selected.png'), 
  disableIcon: require('../../assets/arrange_disable.png') 
}
const blockItem: ResourceFuncItem = { 
  title: '排列block', 
  command: 'arrange', 
  iconWidth: '16px', 
  icon: require('../../assets/block_icon.png'), 
  selectedIcon: require('../../assets/block_selected.png'), 
  disableIcon: require('../../assets/block_disable.png') 
}
const clearTrashItem: ResourceFuncItem = { 
  title: '清空回收站', 
  command: 'clearTrash', 
  iconWidth: '16px', 
  icon: require('../../assets/transport_icon.png'), 
  disableIcon: require('../../assets/trash_disable.png'), 
  selectedIcon: require('../../assets/trash_selected.png') 
}

const recentFuncList = [refreshItem, arrangeItem]
const commonFuncList = [refreshItem, sortDescItem, arrangeItem]
const backupFunList = [searchItem, refreshItem, sortDescItem, arrangeItem]
const customFuncList = [refreshItem]
const storageFuncList = [refreshItem]
const shareFuncList = [refreshItem]
const recycleFuncList = [clearTrashItem, refreshItem, searchItem, arrangeItem]

const newFolderItem: ResourceFuncItem = { icon: require('../../assets/new_folder_icon.png'), command: 'newFolder', iconWidth: '16px', title: '新建文件夹', disableIcon: require('../../assets/new_folder_disable.png'), selectedIcon: require('../../assets/new_folder_selected.png'), disable: true }
const newAlbum: ResourceFuncItem = { icon: require('../../assets/new_folder_icon.png'), command: 'newCustom', iconWidth: '16px', title: '新建相册', disableIcon: require('../../assets/new_folder_disable.png'), selectedIcon: require('../../assets/new_folder_selected.png') }
const uploadItem: ResourceFuncItem = { icon: require('../../assets/upload_icon.png'), command: 'upload', iconWidth: '16px', title: '上传', disableIcon: require('../../assets/upload_disable.png'), selectedIcon: require('../../assets/upload_icon_selected.png'), disable: true }
const offlineItem: ResourceFuncItem = { icon: require('../../assets/download_icon.png'), command: 'offline', iconWidth: '16px', title: '离线下载', disableIcon: require('../../assets/download_disable.png'), selectedIcon: require('../../assets/download_icon_selected.png') }
const toolbars = [uploadItem, newFolderItem, offlineItem]
const customToolbars = [uploadItem, newAlbum, offlineItem]

export {
  searchItem,
  ResourceFuncItem,
  commonFuncList,
  customFuncList,
  backupFunList,
  storageFuncList,
  toolbars,
  customToolbars,
  recentFuncList,
  recycleFuncList,
  shareFuncList,
  sortAscItem,
  sortDescItem,
  blockItem,
  arrangeItem
}
