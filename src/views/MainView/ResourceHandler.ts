import _ from 'lodash'
import { ResourceItem, ResourceType, ShareStatus, CollectStatus, OrderType, CollectItem, ShareItem } from '@/api/NasFileModel'
import { CategoryType } from '../../model/categoryList'
import { OperateGroup, OperateItem, operateList, itemOperateList } from '@/components/OperateListAlter/operateList'
import { ClipboardModel } from '@/store/modules/Resource'
import StringUtility from '@/utils/StringUtility'
import { NasUser } from '@/api/ClientModel'

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
        if (rtype !== ResourceType.image && rtype !== ResourceType.video && rtype !== ResourceType.audio && rtype !== ResourceType.folder) {
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
  // shift多选规则: 
  // 1. 如果当前有选中：取第一个已选中item的下标bIndex，将aIndex与bIndex之间的所有item全部选中
  // 2. 如果当前没有选中， 直接选中当前的item
  shiftMultipleSelect (showList: Array<ResourceItem>, aIndex: number) {
    const firstIndex = this.getFirstSelectItemIndex(showList)
    if (firstIndex === -1) {
      return this.setSelectState(showList, aIndex, true)
    }
    const beginIndex = firstIndex > aIndex ? aIndex : firstIndex
    const endIndex = firstIndex + aIndex - beginIndex
    return showList.map((item, index) => {
      if (index >= beginIndex && index <= endIndex) item.isSelected = true
      return item
    })
  },
  // 重置选中状态
  resetSelectState (currentShowList: Array<ResourceItem>) {
    return currentShowList.map(item => {
      item.isSelected = false
      return item
    })
  },
  // 重置禁用状态
  resetDisableState (showArray: Array<ResourceItem>) {
    return showArray.map(item => {
      item.disable = false
      return item
    })
  },
  // 重置item的所有状态
  resetItemState (showArray: Array<ResourceItem>) {
    return showArray.map(item => {
      item.disable = false
      item.isSelected = false
      return item
    })
  },
  // 重置收藏状态, 收藏成功时应该重置item的disable和select状态，并设置当前item的收藏状态
  resetCollectState (showArray: Array<ResourceItem>, status: CollectStatus = CollectStatus.has) {
    return showArray.map(item => {
      if (item.isSelected) item.collected = status
      item.disable = false
      item.isSelected = false
      return item
    })
  },
  // 重置分享状态，分享成功时应该重置item的disable和select状态，并设置当前item的收藏状态
  resetShareState (showArray: Array<ResourceItem>, status: ShareStatus = ShareStatus.has) {
    return showArray.map(item => {
      if (item.isSelected) item.shared = status
      item.disable = false
      item.isSelected = false
      return item
    })
  },
  // 获取第一个选中的item
  getFirstSelectItem (showArray: Array<ResourceItem>) {
    for (let index = 0; index < showArray.length; index++) {
      const element = showArray[index]
      if (element.isSelected) return element
    }
    return null
  },
  // 获取第一个选中item的下标
  getFirstSelectItemIndex (showArray: Array<ResourceItem>) {
    for (let index = 0; index < showArray.length; index++) {
      const element = showArray[index]
      if (element.isSelected) return index
    }
    return -1
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
  // 禁用选中的item，在item发生请求期间都应该调用此接口
  disableSelectItems (showArray: Array<ResourceItem>) {
    let items: Array<ResourceItem> = []
    for (let index = 0; index < showArray.length; index++) {
      const element = showArray[index]
      if (!element.isSelected) continue
      element.disable = true
      showArray.splice(index, 1, element)
      items.push(element)
    }
    return items
  },
  // 格式化返回的数据，用于界面展示
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
  // 3. 多选情况下，如果既包含已分享(收藏)和未分享(收藏)，就展示成不可用的分享(收藏)
  filterItemOperateList (showArray: Array<ResourceItem>) {
    const selectItems = this.getSelectItems(showArray)
    const state = this.calculateOperateItemState(selectItems)
    const multipleDisableItem = ['open', 'info', 'rename']
    const list = _.cloneDeep(itemOperateList)
    return list.map(group => {
      group.items.map(item => {
        if (item.command === 'share') {
          item.disable = state.disableShare
          item.isHidden = !state.showShare
        } else if (item.command === 'unshare') {
          item.disable = state.disableShare
          item.isHidden = state.showShare
        } else if (item.command === 'collect') {
          item.disable = state.disableCollect
          item.isHidden = !state.showCollect
        } else if (item.command === 'uncollect') {
          item.disable = state.disableCollect
          item.isHidden = state.showCollect
        } else if (multipleDisableItem.indexOf(item.command) !== -1) {
          item.disable = state.disable
        }
        return item
      })
      return group
    })
  },
  // 计算item的右键菜单列表的显示、隐藏、禁用状态
  calculateOperateItemState (selectItems: Array<ResourceItem>) {
    const disable = selectItems.length > 1
    const showShare = selectItems[0].shared === ShareStatus.not
    const showCollect = selectItems[0].collected === CollectStatus.not
    let disableShare = false
    let disableCollect = false
    for (let index = 1; index < selectItems.length; index++) {
      const element = selectItems[index]
      const elShare = element.shared === ShareStatus.not
      const elCollect = element.collected === CollectStatus.not
      if (showShare !== elShare) disableShare = true
      if (showCollect !== elCollect) disableCollect = true
    }
    return {
      disable, // 是否禁用打开、属性、重命名菜单项
      showShare, // 是否显示分享菜单项
      showCollect, // 是否显示收藏菜单项
      disableShare, // 是否禁用分享菜单项
      disableCollect // 是否禁用收藏菜单项
    }
  },
  // list的右键菜单显示规则
  // 1. 如果剪切板为空，就禁用清空剪切板和粘贴
  filterOperateList (clipboard: ClipboardModel) {
    const disable = _.isEmpty(clipboard)
    const list = _.cloneDeep(operateList)
    return list.map(group => {
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
  },
  // 对当前展示的数据源根据type进行排序
  orderShowArray (showArray: Array<ResourceItem>, type: OrderType) {
    let iterate = 'name'
    let order: OrderEnum = OrderEnum.desc
    switch (type) {
      case OrderType.byNameAsc:
        order = OrderEnum.asc
        break;
      case OrderType.bySizeDesc:
        iterate = 'size'
        break;
      case OrderType.bySizeAsc:
        iterate = 'size'
        order = OrderEnum.asc
        break;
      case OrderType.ByModifyDesc:
        iterate = 'mtime'
        break;
      case OrderType.ByModifyAsc:
        iterate = 'mtime'
        order = OrderEnum.asc
        break;
    }
    return _.orderBy(showArray, [iterate], [order])
  },
  searchShowArray (showArray: Array<ResourceItem>, keyword: string) {
    return showArray.filter(item => {
      return item.name.indexOf(keyword) !== -1
    })
  },
  // 将CollecItem转换成ResourceItem
  convertResourceItem (item: CollectItem | ShareItem) {
    return {
      id: item.file_detail.id,
      uuid: item.uuid,
      type: item.file_detail.type,
      size: item.file_detail.size,
      path: item.path,
      ctime: item.file_detail.ctime,
      mtime: item.file_detail.mtime,
      shared: item.file_detail.shared,
      utime: item.file_detail.atime,
      collected: item.file_detail.collected,
      thumbs: item.file_detail.thumbs,
      name: StringUtility.formatName(item.path),
      showMtime: StringUtility.formatShowMtime(item.file_detail.mtime),
      showSize: StringUtility.formatShowSize(item.file_detail.size)
    }
  }
}

enum OrderEnum  {
  desc = 'desc',
  asc = 'asc'
}
