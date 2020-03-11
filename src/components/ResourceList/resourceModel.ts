enum ArrangeWay {
  horizontal = 0,
  vertical
}
interface ResourceItem {
  collected: number,
  ctime: number,
  duration: number,
  mtime: number,
  path: string,
  shared: number,
  size: number,
  status: number,
  thumbs: any,
  type: number,
  uuid: string
}

export {
  ArrangeWay,
  ResourceItem
}
