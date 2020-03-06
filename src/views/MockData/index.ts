import { ResourceItem, ResourceType } from '../../components/ResourceList/ResourceModel'

const resourceList: Array<ResourceItem> = [
  {
    name: '文件夹1',
    type: ResourceType.folder,
    modifyTime: '2020年2月13日',
    memory: '10M',
    subResources: [
      { name: '文本', type: ResourceType.txt, modifyTime: '2020年2月13日', memory: '10M' }
    ]
  },
  { name: '网页', type: ResourceType.html, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '图片', type: ResourceType.image, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '音频', type: ResourceType.audio, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '视频', type: ResourceType.video, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文本', type: ResourceType.txt, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '电子书', type: ResourceType.pdf, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹8', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹9', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹10', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹11', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹12', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹13', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹14', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹15', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹16', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹17', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹18', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹19', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' },
  { name: '文件夹20', type: ResourceType.folder, modifyTime: '2020年2月13日', memory: '10M' }
]

export {
  resourceList
}
