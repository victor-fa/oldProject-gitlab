import _ from 'lodash'
import { StorageType, StorageInfo } from '@/api/NasFileModel'
import StringUtility from '@/utils/StringUtility'
import store from '@/store'
import { User } from '@/api/UserModel'

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
  matchStorageName (type: StorageType, index: number) {
    switch (type) {
      case StorageType.internal:
      case StorageType.internal_SSD:
      case StorageType.internal_HDD:
        return '内置硬盘' + index
      case StorageType.external:
        return '扩展硬盘' + index
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
  },
  formatStorages (storages: StorageInfo[]) {
    const internalTypes = [StorageType.internal, StorageType.internal_SSD, StorageType.internal_HDD]
    const user = _.get(store.getters, 'User/user') as User
    const ugreenNo = user.ugreenNo
    return storages.map((item, index) => {
      item.custom = 'storage'
      item.showName = this.matchStorageName(item.type, index)
      item.showIcon = this.matchStorageIcon(item.type)
      item.showSize = this.matchStorageSize(item.used, item.size)
      item.showProgress = (item.used / item.size) * 100
      item.isInternal = internalTypes.indexOf(item.type) !== -1
      const path = item.isInternal === true ? `/.ugreen_nas/${ugreenNo}` : '/'
      item.partitions.forEach((partition, index) => {
        partition.showName = `分区${index + 1}`
        partition.showIcon = item.showIcon
        partition.showSize = this.matchStorageSize(partition.used, partition.size)
        partition.showProgress = (partition.used / partition.size) * 100
        partition.isInternal = item.isInternal
        partition.path = path
        partition.custom = 'partition'
      })
      return item
    })
  }
}
