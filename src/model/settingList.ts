enum SettingType {
  logout,
  switching_device,
  system,
  help,
  feedback,
  about,
  quit,
  setup,
  introduction,
  questions,
  download
}

interface Setting {
  type: SettingType,
  title: string,
  childrens?: Setting[]
}

let settingList: Setting[] = [
  { type: SettingType.logout, title: '切换帐号' },
  { type: SettingType.switching_device, title: '切换设备' },
  { type: SettingType.system, title: '系统设置' },
  { type: SettingType.help,
    title: '帮助说明',
    childrens: [
      { type: SettingType.setup, title: '安装指南' },
      { type: SettingType.introduction, title: '功能介绍' },
      { type: SettingType.questions, title: '常见问题' },
      { type: SettingType.download, title: '软件下载' }
    ]
  },
  { type: SettingType.feedback, title: '投诉建议' },
  { type: SettingType.about, title: '关于' },
  { type: SettingType.quit, title: '退出' }
]

export {
  Setting,
  settingList,
  SettingType
}
