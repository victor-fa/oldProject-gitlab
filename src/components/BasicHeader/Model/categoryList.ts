interface Category {
  type: CategoryType | TaskCategoryType,
  title: string,
  isSelected: boolean
}

enum CategoryType {
  all = 'all',
  image = 'image',
  audio = 'audio',
  video = 'video',
  document = 'document'
}

enum TaskCategoryType {
  download = 'download',
  upload = 'upload',
  offline = 'offline',
  backup = 'backup',
  remote = 'remote'
}

// 最近使用
let categorys: Category[] = [
  {
    type: CategoryType.all,
    title: '所有',
    isSelected: true
  },
  {
    type: CategoryType.image,
    title: '图片',
    isSelected: false
  },
  {
    type: CategoryType.video,
    title: '视频',
    isSelected: false
  },
  {
    type: CategoryType.audio,
    title: '音频',
    isSelected: false
  },
  {
    type: CategoryType.document,
    title: '文档',
    isSelected: false
  }
]

// 任务管理
let taskCategorys: Category[] = [
  {
    type: TaskCategoryType.download,
    title: '下载列表',
    isSelected: true
  },
  {
    type: TaskCategoryType.upload,
    title: '上传列表',
    isSelected: false
  },
  {
    type: TaskCategoryType.offline,
    title: '离线列表',
    isSelected: false
  },
  {
    type: TaskCategoryType.backup,
    title: '备份列表',
    isSelected: false
  },
  {
    type: TaskCategoryType.remote,
    title: '远程操作',
    isSelected: false
  }
]

export {
  categorys,
  taskCategorys,
  Category,
  CategoryType
}
