import { ResourceType } from '@/api/NasFileModel'

interface Category {
  type: ResourceType | TaskCategoryType,
  title: string,
  isSelected: boolean
}

enum TaskCategoryType {
  download = 'download',
  upload = 'upload',
  offline = 'offline',
  backup = 'backup-list',
  remote = 'remote'
}

// 最近使用
let categorys: Category[] = [
  {
    type: ResourceType.all,
    title: '所有',
    isSelected: true
  },
  {
    type: ResourceType.image,
    title: '图片',
    isSelected: false
  },
  {
    type: ResourceType.video,
    title: '视频',
    isSelected: false
  },
  {
    type: ResourceType.audio,
    title: '音频',
    isSelected: false
  },
  {
    type: ResourceType.document,
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
    type: TaskCategoryType.remote,
    title: '其它操作',
    isSelected: false
  }
]

export {
  categorys,
  taskCategorys,
  Category,
  TaskCategoryType
}
