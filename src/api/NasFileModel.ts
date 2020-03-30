enum ArrangeWay {
  horizontal = 0,
  vertical
}

enum ResourceType {
  unknown = 0,
  video = 1,
  audio = 2,
  image = 3,
  document = 4,
  archive = 5,
  floder = 6
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
  // custom property
  isSelected: boolean,
  disable: boolean
}

interface CollectItem {
  uuid: string,
  path: string,
  ugreen_no: number,
  file_detail: CollectItemDetail
}

interface CollectItemDetail {
  id: number,
  type: ResourceType,
  size: number,
  path: string,
  tags: Array<string>,
  ctime: number,
  utime: number,
  mtime: number,
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
  ByModifyAsc = 6
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
  used: number // curr partition used spac
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
  partitions: Array<PartitionInfo>
}

// 文件上传历史排序规则
enum UploadTimeSort {
  descend = 1,
  ascend
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
  CollectItemDetail
}
