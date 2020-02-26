interface Category {
  type: string,
  title: string,
  isSelected: boolean
}

let categorys: Category[] = [
  {
    type: 'all',
    title: '所有',
    isSelected: true
  },
  {
    type: 'image',
    title: '图片',
    isSelected: false
  },
  {
    type: 'video',
    title: '视频',
    isSelected: false
  },
  {
    type: 'audio',
    title: '音频',
    isSelected: false
  },
  {
    type: 'document',
    title: '文档',
    isSelected: false
  }
]

export {
  categorys,
  Category
}
