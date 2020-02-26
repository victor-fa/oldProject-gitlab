enum SortKind {
  name,
  time,
  memory,
  fileType
}

enum SortType {
  ascending,
  descending
}

interface SortKindItem {
  kind: SortKind,
  title: string,
  isSelected: boolean
}

interface SortTypeItem {
  type: SortType,
  title: string,
  isSelected: boolean
}

interface SortWay {
  type: SortType,
  kind: SortKind
}

let sortList = {
  kinds: [
    { kind: SortKind.name, title: '文件名', isSelected: true },
    { kind: SortKind.time, title: '时间', isSelected: false },
    { kind: SortKind.memory, title: '大小', isSelected: false },
    { kind: SortKind.fileType, title: '类型', isSelected: false }
  ],
  types: [
    { type: SortType.ascending, title: '升序', isSelected: true },
    { type: SortType.descending, title: '降序', isSelected: false }
  ]
}

export {
  sortList,
  SortKindItem,
  SortTypeItem,
  SortWay
}
