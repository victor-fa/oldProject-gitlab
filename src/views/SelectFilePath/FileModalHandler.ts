import _ from 'lodash'
import { PartitionInfo, ResourceItem, StorageInfo, CustomModule } from '@/api/NasFileModel'

enum CacheType {
  disk,
  partition,
  resource
}

interface CacheParams {
  name: string,
  type?: CacheType, // 当前缓存的数据类型(磁盘列表，分区列表，目录列表), 默认为目录列表
  path?: string,
  uuid?: string,
  selectedItem?: undefined | StorageInfo | PartitionInfo | CustomModule | ResourceItem
}

export {
  CacheParams,
  CacheType
}

export default {
  // 当breadcrumb item超出长度时，实现中间缩略
  calculateShowPaths (component: Vue): Promise<number | undefined> {
    return new Promise((resolve) => {
      component.$nextTick(() => {
        const breadcrumb = component.$refs.breadcrumb as Vue
        const width = breadcrumb.$el.clientWidth
        if (width >= breadcrumb.$el.scrollWidth) return
        const childrens = breadcrumb.$children
        let fixedWidth = (childrens[0].$el as HTMLElement).offsetWidth + 40
        const count = childrens.length
        for (let index = count - 1; index >= 0; index--) {
          const element = childrens[index].$el as HTMLElement
          fixedWidth += element.offsetWidth
          if (fixedWidth >= width) {
            resolve(index)
            break
          }
        }
        if (fixedWidth < width) resolve(undefined)
      })
    })
  },
  // 替换数组中的元素
  replaceElement (items: CacheParams[], start: number, length: number, ele: string) {
    let paths = items.map(item => {
      return item.name
    })
    paths.splice(start, length)
    paths.splice(1, 0, ele)
    return paths
  },
  /**重置item的选中状态 */
  resetItemSelected<T> (items: Array<T>) {
    return items.map((item: any) => {
      item.isSelected = false
      return item as T
    })
  },
  /**选中单个item */
  setItemSelected<T> (items: T[], aIndex: number) {
    const item = items[aIndex] as any
    if (item.isSelected === true) return items
    return items.map((item: any, index) => {
      if (aIndex === index) {
        item.isSelected = true
      } else {
        item.isSelected = false
      }
      return item as T
    })
  },
  /**栈顶推入一个元素 */
  pushCache (cacheItems: CacheParams[], aItem: StorageInfo | PartitionInfo | CustomModule | ResourceItem) {
    if (_.isEmpty(cacheItems)) return cacheItems
    const cache = this.generateCacheParams(aItem)
    if (cache === undefined) return cacheItems
    const items = cacheItems.concat([cache])
    return items.map((item, index) => {
      if (index === items.length - 2) {
        item.selectedItem = aItem
      }
      return item
    })
  },
  /**根据选中的数据类型生成对应的缓存模型 */
  generateCacheParams (item: StorageInfo | PartitionInfo | CustomModule | ResourceItem): CacheParams | undefined {
    switch (item.custom) {
      case 'storage':
        return handleStorageInfo(item as StorageInfo)
      case 'partition':
        return {
          name: (item as PartitionInfo).showName,
          type: CacheType.resource,
          path: (item as PartitionInfo).path,
          uuid: (item as PartitionInfo).uuid
        }
      case 'custom':
        return {
          name: (item as CustomModule).name,
          type: CacheType.resource,
          path: (item as CustomModule).path,
          uuid: (item as CustomModule).uuid
        }
      case 'resource':
        return {
          name: (item as ResourceItem).name,
          type: CacheType.resource,
          path: (item as ResourceItem).path,
          uuid: (item as ResourceItem).uuid
        }
      default:
        console.log(item.custom)
        break;
    }
  },
  parseDiskItem (item: StorageInfo | CustomModule) {
    if (item.custom === 'storage') {
      return {
        path: (item as StorageInfo).partitions[0].path,
        uuid: (item as StorageInfo).partitions[0].uuid,
      }
    } else {
      return {
        path: (item as CustomModule).path,
        uuid: (item as CustomModule).uuid
      }
    }
  }
 }

 const handleStorageInfo = (item: StorageInfo): CacheParams => {
   if (item.partitions.length === 1) {
     const partition = item.partitions[0]
     return {
      name: item.showName,
      type: CacheType.resource,
      path: partition.path,
      uuid: partition.uuid
     }
   } else {
     // 分区的选中状态也有缓存
     const selectedItem = item.partitions.filter(item => {
       return item.isSelected === true
     })[0]
    return {
      selectedItem,
      name: item.showName,
      type: CacheType.partition
    }
   }
 }
