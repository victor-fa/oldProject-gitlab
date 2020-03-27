enum ArrangeWay {
  horizontal = 0,
  vertical
}

enum ResourceType {
  video = 1,
  audio,
  image,
  document,
  archive,
  floder
}

enum ResourceStatus {
  unlock = 0,
  prelock,
  locked
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
  shared: number,
  utime: number,
  alias: string,
  collected: number,
  duration: number,
  thumbs: Array<string>,
  // calculate property
  name: string,
  showMtime: string,
  showSize: string,
  // custom property
  isSelected: boolean
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
  ArrangeWay,
  OrderType,
  StorageType,
  StorageInfo,
  PartitionInfo,
  UploadTimeSort
}
