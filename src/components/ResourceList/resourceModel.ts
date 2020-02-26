enum ArrangeWay {
  horizontal = 0,
  vertical
}
enum ResourceType {
  folder,
  html,
  image,
  audio,
  video,
  txt,
  pdf
}
interface ResourceItem {
  name: string,
  type: ResourceType,
  modifyTime: string,
  memory: string,
  subResources?: Array<ResourceItem>
}

export {
  ArrangeWay,
  ResourceType,
  ResourceItem
}
