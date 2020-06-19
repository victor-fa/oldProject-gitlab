import { TaskStatus } from '@/api/Transport/BaseTask'

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
const refreshItem: TransportOpItem = {
  icon: require('../../../assets/refresh_icon.png'),
  hoverIcon: require('../../../assets/refresh_icon_selected.png'),
  command: 'refresh',
  iconWidth: '11px'
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
const pauseOperateItems: TransportOpItem[] = [
  continueItem,
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
const remoteCompletedOperateItems: TransportOpItem[] = [
  {
    icon: require('../../../assets/delete_icon.png'),
    hoverIcon: require('../../../assets/delete_icon_selected.png'),
    command: 'delete',
    iconWidth: '11px'
  }
]

interface BatchItem {
  title: string,
  command: string,
  disable?: boolean
}

const doneItems: BatchItem[] = [
  { title: '清空所有记录', command: 'clearAll' }
]

enum TransportStatus {
  doing,
  done
}

interface TransportCategory {
  name: string,
  status: TransportStatus,
  count: number,
  isSelected: boolean,
  batchItems: BatchItem[]
}

// 传输条目分类
const downloadItems: BatchItem[] = [
  { title: '全部暂停', command: 'pauseAll' },
  { title: '继续下载', command: 'resumeAll' },
  { title: '全部取消', command: 'cancelAll' }
]
const downloadCategorys: TransportCategory[] = [
  { name: '正在下载', status: TransportStatus.doing, count: 0, isSelected: true, batchItems: downloadItems },
  { name: '下载完成', status: TransportStatus.done, count: 0, isSelected: false, batchItems: doneItems }
]

const uploadItems: BatchItem[] = [
  { title: '全部暂停', command: 'pauseAll' },
  { title: '继续上传', command: 'resumeAll' },
  { title: '全部取消', command: 'cancelAll' }
]
const uploadCategorys: TransportCategory[] = [
  { name: '正在上传', status: TransportStatus.doing, count: 0, isSelected: true, batchItems: uploadItems },
  { name: '上传完成', status: TransportStatus.done, count: 0, isSelected: false, batchItems: doneItems }
]

const backupItems: BatchItem[] = [
  { title: '新增备份', command: 'addTask' },
  { title: '全部暂停', command: 'pauseAll' },
  { title: '继续上传', command: 'resumeAll' },
  { title: '全部取消', command: 'cancelAll' }
]
const backupCategorys: TransportCategory[] = [
  { name: '正在备份', status: TransportStatus.doing, count: 0, isSelected: true, batchItems: backupItems },
  { name: '备份完成', status: TransportStatus.done, count: 0, isSelected: false, batchItems: doneItems }
]

const offlineCategorys: TransportCategory[] = [
  { name: '正在下载', status: TransportStatus.doing, count: 0, isSelected: true, batchItems: downloadItems },
  { name: '下载完成', status: TransportStatus.done, count: 0, isSelected: false, batchItems: doneItems }
]

const remoteItems: BatchItem[] = [
  { title: '全部暂停', command: 'pauseAll' },
  { title: '继续传输', command: 'resumeAll' },
  { title: '全部取消', command: 'cancelAll' }
]
const remoteCategorys: TransportCategory[] = [
  { name: '正在进行', status: TransportStatus.doing, count: 0, isSelected: true, batchItems: remoteItems },
  { name: '操作完成', status: TransportStatus.done, count: 0, isSelected: false, batchItems: doneItems }
]

// TransportItem.vue对应的数据模型
interface TransportModel {
  id: number,
  status: TaskStatus, // 任务状态
  category: TransportStatus, // 传输状态
  icon: any, // 资源图标
  speed: string, // 展示的速度
  total: string, // 总数
  progress: string, // 进度描述
  progressPercent: number // 进度百分比(0~100)
  name: string, // 原路径
  controlItems: TransportOpItem[], // 操作按钮集合
  path: string,
  uuid: string
}

export {
  TransportOpItem,
  pauseItem,
  continueItem,
  refreshItem,
  runningOperateItems,
  pauseOperateItems,
  completedOperateItems,
  remoteCompletedOperateItems,
  TransportModel,
  BatchItem,
  TransportStatus,
  TransportCategory,
  downloadCategorys,
  uploadCategorys,
  backupCategorys,
  offlineCategorys,
  remoteCategorys
}
