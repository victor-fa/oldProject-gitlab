import { DeviceRole, DeviceStatus, UserSex } from './UserModel'

interface NasAccessInfo {
  role: DeviceRole,
  status: DeviceStatus,
  // eslint-disable-next-line camelcase
  api_token: string,
  // eslint-disable-next-line camelcase
  refresh_token: string,
  key: string,
  data: NasUser
}

enum NasActive {
  notBind = 0,
  Bound = 1
}

interface NasInfo {
  active: NasActive,
  name: string,
  model: string,
  mac: string,
  ip: string,
  sn: string,
  port: number,
  softversion: string
}

interface NasUser {
  // eslint-disable-next-line camelcase
  ugreen_no: number,
  // eslint-disable-next-line camelcase
  phone_no: string,
  // eslint-disable-next-line camelcase
  nic_name: string,
  email: string,
  sex: UserSex,
  birthday: number,
  version: number
}

export {
  NasAccessInfo,
  NasInfo,
  NasActive,
  NasUser
}
