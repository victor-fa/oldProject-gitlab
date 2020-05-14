enum SettingType {
  system,
  about,
  feedback,
  logout,
  switching_device,
  quit
}

interface Setting {
  type: SettingType,
  title: string
}

let settingList: Setting[] = [
  { type: SettingType.system, title: '系统设置' },
  { type: SettingType.about, title: '关于' },
  { type: SettingType.feedback, title: '反馈' },
  { type: SettingType.logout, title: '切换用户' },
  { type: SettingType.switching_device, title: '切换设备' },
  { type: SettingType.quit, title: '退出' }
]

export {
  Setting,
  settingList,
  SettingType
}
