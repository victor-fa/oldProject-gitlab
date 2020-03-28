import _ from 'lodash'
import { ResourceItem, ResourceType, ShareStatus, CollectStatus } from '@/api/NasFileModel'
import { CategoryType } from '../../model/categoryList'
import { OperateGroup } from '@/components/OperateListAlter/operateList'
import { ClipboardModel } from '@/store/modules/Resource'
import StringUtility from '@/utils/StringUtility'

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
  // 设置aIndex对应item的选中状态, 有互斥性
  setSingleSelectState (currentShowList: Array<ResourceItem>, aIndex: number, selected: boolean) {
    return currentShowList.map((item, index) => {
      if (index === aIndex) {
        item.isSelected = selected
      } else {
        item.isSelected = false
      }
      return item
    })
  },
  // 设置aIndex对应item的状态，没有互斥性
  setSelectState (showList: Array<ResourceItem>, aIndex: number, selected: boolean) {
    return showList.map((item, index) => {
      if (aIndex === index) item.isSelected = selected
      return item
    })
  },
  // 重置选中状态
  resetSelectState (currentShowList: Array<ResourceItem>) {
    for (let index = 0; index < currentShowList.length; index++) {
      const element = currentShowList[index]
      if (!element.isSelected) continue
      element.isSelected = false
      currentShowList.splice(index, 1, element)
    }
  },
  // 获取第一个选中的item
  getFirstSelectItem (showArray: Array<ResourceItem>) {
    for (let index = 0; index < showArray.length; index++) {
      const element = showArray[index]
      if (element.isSelected) return element
    }
    return null
  },
  // 获取选中的item
  getSelectItems (showArray: Array<ResourceItem>) {
    let items: Array<ResourceItem> = []
    for (let index = 0; index < showArray.length; index++) {
      const element = showArray[index]
      if (element.isSelected) items.push(element) 
    }
    return items
  },
  formateResponseList (list: Array<ResourceItem>) {
    return list.map(value => {
      value.name = StringUtility.formatName(value.path)
      value.showMtime = StringUtility.formatShowMtime(value.mtime)
      value.showSize = StringUtility.formatShowSize(value.size)
      return value
    })
  },
  // 计算在window内的安全点
  calculateSafePositionOnWindow (clientX: number, clientY: number, alter: Vue) {
    const width = document.body.clientWidth
    const height = document.body.clientHeight
    const paddingRight = 10; const paddingBottom = 20
    const alterWidth = alter.$el.clientWidth + paddingRight
    const alterHeight = alter.$el.clientHeight + paddingBottom
    let left = clientX + alterWidth < width ? clientX : width - alterWidth
    let top = clientY + alterHeight < height ? clientY : height - alterHeight
    return { left: left + 'px', top: top + 'px' }
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
  },
  // item的右键菜单显示规则：
  // 1. 已分享的显示取消分享，已收藏的显示取消收藏
  // 2. 多选情况下，打开，属性，重命名不可用
  filterItemOperateList (showArray: Array<ResourceItem>, itemOperateList: Array<OperateGroup>) {
    const selectItems = this.getSelectItems(showArray)
    console.log(selectItems)
    const disable = selectItems.length > 1
    const multipleDisableItem = ['open', 'info', 'rename']
    const showShare = selectItems[0].shared === ShareStatus.not
    const showCollect = selectItems[0].collected === CollectStatus.not
    return itemOperateList.map(group => {
      group.items.map(opItem => {
        if (opItem.command === 'share') {
          opItem.hide = !showShare
        } else if (opItem.command === 'unshare') {
          opItem.hide = showShare
        } else if (opItem.command === 'collect') {
          opItem.hide = !showCollect
        } else if (opItem.command === 'uncollect') {
          opItem.hide = showCollect
        } else if (multipleDisableItem.indexOf(opItem.command) !== -1) {
          opItem.disable = disable
        }
        return opItem
      })
      return group
    })
  },
  // list的右键菜单显示规则
  // 1. 如果剪切板为空，就禁用清空剪切板和粘贴
  filterOperateList (clipboard: ClipboardModel, operateList: Array<OperateGroup>) {
    const disable = _.isEmpty(clipboard)
    return operateList.map(group => {
      group.items.map(item => {
        if (item.command === 'clearClipboard') {
          item.disable = disable
        } else if (item.command === 'paste') {
          item.disable = disable
        }
        return item
      })
      return group
    })
  }
}
