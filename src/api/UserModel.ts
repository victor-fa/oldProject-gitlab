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

interface User {
  uid: string,
  nasNo: string,
  userName: string,
  nickName: string,
  birthday: number,
  sex: number,
  areaNo: string,
  phoneNo: string,
  image: string,
  userSay: string,
  status: number,
  versionNo: string,
  email: string,
  ctime: Date,
  utime: Date
}

interface AccessToken {
  accessToken: string,
  refreshToken: string,
  expiresTime: number
}

interface LoginResponse {
  accessToken: AccessToken,
  user: User
}

interface Account {
  account: string,
  password: string
}

export {
  BasicResponse,
  SmsType,
  LoginResponse,
  AccessToken,
  User,
  Account
}
