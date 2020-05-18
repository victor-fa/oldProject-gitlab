import _ from 'lodash'
import { CustomModule } from '@/api/NasFileModel'

enum CacheType {
  disk,
  partition,
  resource
}

interface CacheParams {
  name: string,
  type?: CacheType, // 当前缓存的数据类型(磁盘列表，分区列表，目录列表), 默认为目录列表
  path?: string,
  index?: number,
  uuid?: string
}

export {
  CacheParams,
  CacheType
}

export default {
  // 当breadcrumb item超长时，实现中间缩略
  calculateShowPaths (component: Vue): Promise<number | undefined> {
    return new Promise((resolve) => {
      component.$nextTick(() => {
        const breadcrumb = component.$refs.breadcrumb as Vue
        const width = breadcrumb.$el.clientWidth
        if (width >= breadcrumb.$el.scrollWidth) return
        const childrens = breadcrumb.$children
        let fixedWidth = (childrens[0].$el as HTMLElement).offsetWidth + 30
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
  }
}
