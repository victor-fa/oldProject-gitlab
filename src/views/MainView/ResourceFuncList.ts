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

const searchItem: ResourceFuncItem = { icon: require('../../assets/search_icon.png'), command: 'search', iconWidth: '16px', title: '搜索', disableIcon: require('../../assets/search_disable.png') }
const refreshItem: ResourceFuncItem = { icon: require('../../assets/refresh_icon.png'), command: 'refresh', iconWidth: '16px', title: '刷新', disableIcon: require('../../assets/refresh_disable.png') }
const sortItem: ResourceFuncItem = { icon: require('../../assets/sort_icon.png'), command: 'sort', iconWidth: '16px', title: '排序', disableIcon: require('../../assets/sort_disable.png') }
const arrangeItem: ResourceFuncItem = { icon: require('../../assets/arrange_icon.png'), command: 'arrange', iconWidth: '16px', selectedIcon: require('../../assets/block_icon.png'), title: '排列', disableIcon: require('../../assets/block_disable.png') }

const commonFuncList = [refreshItem, sortItem, arrangeItem]
const backupFunList = [searchItem, refreshItem, sortItem, arrangeItem]
const customFuncList = [refreshItem]
const storageFuncList = [refreshItem]

const newFolderItem: ResourceFuncItem = { icon: require('../../assets/new_folder_icon.png'), command: 'newFolder', iconWidth: '16px', title: '新建文件夹', disableIcon: require('../../assets/new_folder_disable.png'), disable: true }
const newAlbum: ResourceFuncItem = { icon: require('../../assets/new_folder_icon.png'), command: 'newCustom', iconWidth: '16px', title: '新建相册', disableIcon: require('../../assets/new_folder_disable.png') }
const uploadItem: ResourceFuncItem = { icon: require('../../assets/upload_icon.png'), command: 'upload', iconWidth: '16px', title: '上传', disableIcon: require('../../assets/upload_disable.png'), disable: true }
const offlineItem: ResourceFuncItem = { icon: require('../../assets/download_icon.png'), command: 'offline', iconWidth: '16px', title: '离线下载', disableIcon: require('../../assets/download_disable.png') }
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
  customToolbars
}
