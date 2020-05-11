import { StorageType, StorageInfo } from '@/api/NasFileModel'
import StringUtility from '@/utils/StringUtility'

export default {
  matchStorageIcon (type: StorageType) {
    switch (type) {
      case StorageType.internal:
      case StorageType.internal_SSD:
      case StorageType.internal_HDD:
        return require('../../assets/builtin_disk.png')
      case StorageType.external:
      case StorageType.external_SSD:
      case StorageType.external_HDD:
        return require('../../assets/mobile_disk.png')
      case StorageType.external_USB:
        return require('../../assets/u_disk.png')
      default:
        return require('../../assets/builtin_disk.png')
    }
  },
  matchStorageName (type: StorageType) {
    switch (type) {
      case StorageType.internal:
        return '内置硬盘'
      case StorageType.internal_SSD:
        return '内置硬盘'
      case StorageType.internal_HDD:
        return '内置硬盘'
      case StorageType.external:
        return '扩展硬盘'
      case StorageType.external_SSD:
        return '扩展硬盘'
      case StorageType.external_HDD:
        return '扩展硬盘'
      case StorageType.external_USB:
        return 'U盘'
      default:
        return '内置硬盘'
    }
  },
  matchStorageSize (used: number, total: number) {
    const usedSize = StringUtility.formatShowSize(used)
    const totaoSize = StringUtility.formatShowSize(total)
    return `${usedSize}/${totaoSize}`
  },
  // 获取第一个被选中item的下标
  getFristSelectedIndex (showArray: Array<StorageInfo>) {
    let item: number | null = null
    for (let index = 0; index < showArray.length; index++) {
      const element = showArray[index]
      if (element.isSelected === true) {
        item = index
        break
      } 
    }
    return item
  }
}
