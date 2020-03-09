interface BasicResponse {
  msg: string,
  code: number,
  data: any
}

enum SmsType {
  login = 0,
  register,
  resetPassword,
  unbind,
  bind,
  changePhone
}

enum UserSex {
  male = 0,
  female = 1
}

interface User {
  uid: string,
  nasNo: string,
  userName: string,
  nickName: string,
  birthday: number,
  sex: UserSex,
  areaNo: string,
  phoneNo: string,
  image: string,
  userSay: string,
  status: number,
  versionNo: number,
  email: string,
  ctime: Date,
  utime: Date,
  ugreenNo: number
}

interface AccessToken {
  // eslint-disable-next-line camelcase
  access_token: string,
  // eslint-disable-next-line camelcase
  refresh_token: string,
  // eslint-disable-next-line camelcase
  expires_time: number
}

interface LoginResponse {
  accessToken: AccessToken,
  user: User
}

interface Account {
  account: string,
  password: string
}

enum DeviceRole {
  user = '0',
  admin = '1'
}

enum DeviceStatus {
  offline = 0,
  online = 1,
  scrapped = -1
}

interface DeviceInfo {
  uno: number,
  role: DeviceRole,
  sn: string,
  mac: string,
  firmware: string,
  hareware: string,
  status: DeviceStatus,
  image: string,
  remark: string,
  privateKey: string,
  publicKey: string,
  secretKey: string,
  ctime: number
}

export {
  BasicResponse,
  SmsType,
  LoginResponse,
  AccessToken,
  User,
  Account,
  DeviceRole,
  DeviceStatus,
  DeviceInfo,
  UserSex
}
