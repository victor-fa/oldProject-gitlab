import { ResourceItem, ResourceType } from '@/api/NasFileModel'
import { CategoryType } from '../BasicHeader/Model/categoryList'

export default {
  // 对资源列表进行分类
  classifyArray (dataSource: Array<ResourceItem>, type: CategoryType) {
    let newArray: Array<ResourceItem> = []
    for (let index = 0; index < dataSource.length; index++) {
      const element = dataSource[index] as ResourceItem
      if (this.isInclude(type, element.type)) {
        newArray.push(element)
      }
    }
    return newArray
  },
  isInclude (ctype: CategoryType, rtype: ResourceType) {
    switch (ctype) {
      case CategoryType.all:
        return true
      case CategoryType.image:
        if (rtype === ResourceType.image) {
          return true
        }
        break
      case CategoryType.video:
        if (rtype === ResourceType.video) {
          return true
        }
        break
      case CategoryType.audio:
        if (rtype === ResourceType.audio) {
          return true
        }
        break
      case CategoryType.document:
        if (rtype !== ResourceType.image && rtype !== ResourceType.video && rtype !== ResourceType.audio && rtype !== ResourceType.floder) {
          return true
        }
        break
    }
    return false
  },
  // 计算在window内的安全点
  calculateSafePositionOnWindow (clientX: number, clientY: number) {
    const width = document.body.clientWidth
    const height = document.body.clientHeight
    const paddingRight = 10; const paddingBottom = 17
    const alterWidth = 100 + paddingRight
    const alterHeight = 189 + paddingBottom
    let left = clientX + alterWidth < width ? clientX : width - alterWidth
    let top = clientY + alterHeight < height ? clientY : height - alterHeight
    return { left: left + 'px', top: top + 'px' }
  },
  // 设置aIndex对应item的选中状态
  // isNot 标记是否取反,如果为true，就取反aIndex对应的item，否则将aIndex对应的item置为true
  setSelectState (currentShowList: Array<ResourceItem>, aIndex: number, isNot: boolean) {
    for (let index = 0; index < currentShowList.length; index++) {
      const element = currentShowList[index]
      // set selecte state of the current item
      if (index === aIndex) {
        element.isSelected = isNot ? !element.isSelected : true
        currentShowList.splice(index, 1, element)
        continue
      }
      // reset selete state of the other item 
      if (element.isSelected) {
        element.isSelected = false
        currentShowList.splice(index, 1, element)
      }
    }
  },
  // 计算弹窗列表的安全点
  calculateSafePosition (event: MouseEvent, list: Element, alter: Element) {
    const point = this.getClickPoint(event, list)
    const width = list.clientWidth
    const height = list.clientHeight
    const padding = 3
    // TODO: 目前alter的宽高是写死的，后面应该获取实时宽高
    const alterWidth = 100 + padding
    const alterHeight = 189 + padding
    let left = point.x + alterWidth < width ? point.x : width - alterWidth
    let top = point.y + alterHeight < height ? point.y : height - alterHeight
    return { left: left + 'px', top: top + 'px' }
  },
  // 获取鼠标点击的坐标，相对于el的坐标系
  getClickPoint (event: MouseEvent, el: Element) {
    const listX = (el.getBoundingClientRect() as DOMRect).x
    const listY = (el.getBoundingClientRect() as DOMRect).y
    return { x: event.clientX - listX, y: event.clientY - listY }
  }
}
