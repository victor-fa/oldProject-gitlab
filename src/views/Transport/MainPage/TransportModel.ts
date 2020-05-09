import { UploadStatus } from '@/model/categoryList'
import { ResourceType } from '@/api/NasFileModel'

interface TransportOpItem {
  icon: any,
  hoverIcon: any,
  command: string,
  iconWidth: string,
  disable?: boolean
}
const pauseItem: TransportOpItem = {
  icon: require('../../../assets/pause_icon.png'),
  hoverIcon: require('../../../assets/pause_icon_selected.png'),
  command: 'pause',
  iconWidth: '7px'
}
const continueItem: TransportOpItem = {
  icon: require('../../../assets/start_icon.png'),
  hoverIcon: require('../../../assets/start_icon_selected.png'),
  command: 'continue',
  iconWidth: '7px'
}
const errorItem: TransportOpItem = {
  icon: require('../../../assets/refresh_icon.png'),
  hoverIcon: require('../../../assets/refresh_icon_selected.png'),
  command: 'error',
  iconWidth: '7px'
}
const runningOperateItems: TransportOpItem[] = [
  pauseItem,
  {
    icon: require('../../../assets/cancle_icon.png'),
    hoverIcon: require('../../../assets/cancle_icon_selected.png'),
    command: 'cancel',
    iconWidth: '9px'
  },
  {
    icon: require('../../../assets/file_icon.png'),
    hoverIcon: require('../../../assets/file_icon_selected.png'),
    command: 'jump',
    iconWidth: '11px'
  }
]
const completedOperateItems: TransportOpItem[] = [
  {
    icon: require('../../../assets/text_icon.png'),
    hoverIcon: require('../../../assets/text_icon_selected.png'),
    command: 'open',
    iconWidth: '9px'
  },
  {
    icon: require('../../../assets/file_icon.png'),
    hoverIcon: require('../../../assets/file_icon_selected.png'),
    command: 'openInFinder',
    iconWidth: '11px'
  },
  {
    icon: require('../../../assets/delete_icon.png'),
    hoverIcon: require('../../../assets/delete_icon_selected.png'),
    command: 'delete',
    iconWidth: '11px'
  }
]

// TransportItem.vue对应的数据模型
interface TransportModel {
  id: number,
  status: UploadStatus, // 任务状态
  type: ResourceType, // 资源类型
  speed: string, // 展示的速度
  total: string, // 总数
  progress: string, // 进度描述
  progressPercent: number // 进度百分比(0~100)
  sourcePath: string, // 原路径
  destinationPath: string // 目标路径
}

export {
  TransportOpItem,
  pauseItem,
  continueItem,
  errorItem,
  runningOperateItems,
  completedOperateItems,
  TransportModel
}
