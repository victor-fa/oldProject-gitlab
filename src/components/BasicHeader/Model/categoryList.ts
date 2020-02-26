interface Category {
  type: CategoryType,
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

export {
  categorys,
  Category,
  CategoryType
}
