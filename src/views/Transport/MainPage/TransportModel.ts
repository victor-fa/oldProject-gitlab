import { TaskStatus } from '@/api/Transport/BaseTask'

interface TransportOpItem {
  icon: any,
  hoverIcon: any,
  command: string,
  iconWidth: string,
  disable?: boolean,
  disableIcon: any
}
const pauseItem: TransportOpItem = {
  icon: require('../../../assets/pause_normal_icon.png'),
  hoverIcon: require('../../../assets/pause_hover_icon.png'),
  disableIcon: require('../../../assets/pause_disable_icon.png'),
  command: 'pause',
  iconWidth: '12px'
}
const continueItem: TransportOpItem = {
  icon: require('../../../assets/begin_normal_icon.png'),
  hoverIcon: require('../../../assets/begin_hover_icon.png'),
  disableIcon: require('../../../assets/begin_normal_icon.png'),
  command: 'continue',
  iconWidth: '12px'
}
const refreshItem: TransportOpItem = {
  icon: require('../../../assets/refresh_normal_icon.png'),
  hoverIcon: require('../../../assets/refresh_hover_icon.png'),
  disableIcon: require('../../../assets/refresh_disable_icon.png'),
  command: 'refresh',
  iconWidth: '12px'
}
const cancelItem: TransportOpItem = {
  icon: require('../../../assets/cancel_normal_icon.png'),
  hoverIcon: require('../../../assets/cancel_hover_icon.png'),
  disableIcon: require('../../../assets/cancel_disable_icon.png'),
  command: 'cancel',
  iconWidth: '12px'
}
const jumpItem: TransportOpItem = {
  icon: require('../../../assets/file_normal_icon.png'),
  hoverIcon: require('../../../assets/file_hover_icon.png'),
  disableIcon: require('../../../assets/file_disable_icon.png'),
  command: 'jump',
  iconWidth: '12px'
}
const deleteItem: TransportOpItem = {
  icon: require('../../../assets/delete_normal_icon.png'),
  hoverIcon: require('../../../assets/delete_hover_icon.png'),
  disableIcon: require('../../../assets/delete_disable_icon.png'),
  command: 'delete',
  iconWidth: '12px'
}
const openItem: TransportOpItem = {
  icon: require('../../../assets/open_normal_icon.png'),
  hoverIcon: require('../../../assets//open_hover_icon.png'),
  disableIcon: require('../../../assets/open_disable_icon.png'),
  command: 'open',
  iconWidth: '12px'
}
const openInFinderItem: TransportOpItem = {
  icon: require('../../../assets/file_normal_icon.png'),
  hoverIcon: require('../../../assets/file_hover_icon.png'),
  disableIcon: require('../../../assets/file_disable_icon.png'),
  command: 'openInFinder',
  iconWidth: '12px'
}
const completedOperateItems: TransportOpItem[] = [openItem, openInFinderItem, deleteItem]
const runningOperateItems: TransportOpItem[] = [pauseItem, cancelItem, jumpItem]
const pauseOperateItems: TransportOpItem[] = [continueItem, cancelItem, jumpItem]
const remoteCompletedOperateItems: TransportOpItem[] = [deleteItem]

interface BatchItem {
  title: string,
  command: string,
  disable?: boolean,
  isHidden?: boolean
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
  { title: '继续下载', command: 'resumeAll', isHidden: true },
  { title: '全部取消', command: 'cancelAll' }
]
const downloadCategorys: TransportCategory[] = [
  { name: '正在下载', status: TransportStatus.doing, count: 0, isSelected: true, batchItems: downloadItems },
  { name: '下载完成', status: TransportStatus.done, count: 0, isSelected: false, batchItems: doneItems }
]

const uploadItems: BatchItem[] = [
  { title: '全部暂停', command: 'pauseAll' },
  { title: '继续上传', command: 'resumeAll', isHidden: true },
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
const offlineItems: BatchItem[] = [
  { title: '新建任务', command: 'newOffline' },
  { title: '全部暂停', command: 'pauseAll' },
  { title: '继续下载', command: 'resumeAll', isHidden: true },
  { title: '全部取消', command: 'cancelAll' }
]
const backupCategorys: TransportCategory[] = [
  { name: '正在备份', status: TransportStatus.doing, count: 0, isSelected: true, batchItems: backupItems },
  { name: '备份完成', status: TransportStatus.done, count: 0, isSelected: false, batchItems: doneItems }
]

const offlineCategorys: TransportCategory[] = [
  { name: '正在下载', status: TransportStatus.doing, count: 0, isSelected: true, batchItems: offlineItems },
  { name: '下载完成', status: TransportStatus.done, count: 0, isSelected: false, batchItems: doneItems }
]

const remoteItems: BatchItem[] = [
  { title: '全部暂停', command: 'pauseAll' },
  { title: '全部继续', command: 'resumeAll', isHidden: true },
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
  uuid: string,
  type: string
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
