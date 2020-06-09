enum ArrangeWay {
  horizontal = 0,
  vertical
}

enum ResourceType {
  all = 0,
  video = 1,
  audio = 2,
  image = 3,
  document = 4,
  archive = 5,
  folder = 6
}

enum ResourceStatus {
  unlock = 0,
  prelock,
  locked
}

enum CollectStatus {
  not = 0,
  has = 1
}

enum ShareStatus {
  not = 0,
  has = 1
}

interface ResourceItem {
  id: number,
  uuid: string,
  type: ResourceType,
  size: number,
  path: string,
  status: ResourceStatus,
  ctime: number,
  mtime: number,
  shared: ShareStatus,
  utime: number,
  alias: string,
  collected: CollectStatus,
  duration: number,
  thumbs: Array<string>,
  name: string,
  md5: string,
  // calculate property
  showMtime: string,
  showSize: string,
  index: number,
  // custom property
  isSelected?: boolean, // 当前item是否是选中状态
  disable?: boolean, // 当前item是否是禁用状态
  renaming?: boolean, // 重命名当前item
  custom: string,
  file_detail?: CollectItem | ShareItem
}

interface CollectItem {
  uuid: string,
  path: string,
  ugreen_no: number,
  file_detail: FileDeatil,
  thumbs: Array<string>
}

interface ShareItem {
  share_id: number,
  uuid: string,
  path: string,
  ugreen_no: number,
  file_detail: FileDeatil,
  thumbs: Array<string>
}

interface FileDeatil {
  id: number,
  type: ResourceType,
  size: number,
  path: string,
  tags: Array<string>,
  ctime: number,
  utime: number,
  mtime: number,
  atime: number,
  shared: number,
  collected: number,
  thumbs: Array<string>
}

enum OrderType {
  byNameDesc = 1,
  byNameAsc = 2,
  bySizeDesc = 3,
  bySizeAsc = 4,
  ByModifyDesc = 5,
  ByModifyAsc = 6,
  ByUploadDesc = 7,
  ByUploadAsc = 8
}

enum StorageType {
  internal = 1,
  external,
  internal_SSD,
  internal_HDD,
  external_SSD,
  external_HDD,
  external_USB
}

interface PartitionInfo {
  label: string,
  uuid: string,
  mount: string,  // mount directory
  fs: string, // file system type,
  size: number, // curr partition space
  used: number, // curr partition used spac
  // custom property
  path: string,
  showName: string,
  showSize: string,
  showProgress: number,
  showIcon: any,
  isInternal: boolean,
  isSelected?: boolean,
  custom: string
}

interface StorageInfo {
  name: string,
  type: StorageType,
  size: number,
  used: number,
  time: number, // used time
  temp: number // current temperature
  bad: number,  // bad sector
  invalid: number, // 磁盘是否不符合单分区ext格式（1不符合，0符合）
  partitions: Array<PartitionInfo>,
  // custom property
  showName: string,
  showSize: string,
  showUsed: string,
  showSizeSimple: string,
  showProgress: number,
  showIcon: any,
  isInternal: boolean,
  isSelected?: boolean,
  custom: string
}

// 文件上传历史排序规则
enum UploadTimeSort {
  descend = 1,
  ascend
}

interface ShareUser {
  ugreen_no: number,
  nic_name: string
}

interface TransportTask {
  id: number, //（任务ID，唯一标识）
  type: ResourceType, //（类型）
  uid: number, //（用户）
  status: number, //（状态）
  total_num: number, //（总数量）
  total_size: number, //（总大小）
  curr_num: number, //（已完成数量（文件））
  curr_size: number, //（已完成大小（字节））
  speed: number,  // 速度，B/s）
  curr_src_path: string, // 当前操作的源文件）
  curr_dst_path: string // (当前操作的目的文件）
}

enum RemoteTaskStatus { // 对应的是16进制
  prerunning = 1,
  running = 2,
  error = 3,
  pause = 8,
  completed = 16
}

interface RemoteTask {
  id: number,
  type: ResourceType,
  uid: number,
  status: RemoteTaskStatus,
  errmsg: string,
  total_num: number,
  total_size: number,
  curr_num: number,
  curr_size: number,
  speed: number,
  curr_src_path: string,
  curr_dst_path: string
}

interface UploadParams {
  uuid?: string,
  path: string,
  start: number, 
  end: number, 
  size: number, 
  md5?: string,
  alias?: string,
  id?: string,
  crypto_token?: string
}

interface DownloadParams {
  uuid: string,
  path: string,
  start: number,
  end: number
}

interface CustomModule {
  path: string,
  uuid: string,
  myself_folder: CustomInfo,
  // custom property
  name: string,
  isSelected?: boolean,
  disable?: boolean,
  custom: string
}

interface CustomInfo {
  name: string,
  title: string,
  brief: string,
  desc: string,
  background_path: string,
  image_path: string,
  tags: string[]
}

export {
  ResourceItem,
  ResourceStatus,
  ResourceType,
  ShareStatus,
  CollectStatus,
  ArrangeWay,
  OrderType,
  StorageType,
  StorageInfo,
  PartitionInfo,
  UploadTimeSort,
  CollectItem,
  FileDeatil,
  ShareUser,
  ShareItem,
  TransportTask,
  RemoteTask,
  RemoteTaskStatus,
  UploadParams,
  CustomModule,
  CustomInfo,
  DownloadParams
}
