import { DeviceRole, DeviceStatus } from './UserModel'

interface NasLoginResponse {
  role: DeviceRole,
  status: DeviceStatus,
  // eslint-disable-next-line camelcase
  api_token: string,
  // eslint-disable-next-line camelcase
  refresh_token: string
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

interface BoardcastResponse<T> {
  error: string,
  data: T
}

export {
  NasLoginResponse,
  NasInfo,
  BoardcastResponse
}
