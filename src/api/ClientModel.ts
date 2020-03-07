import { DeviceRole, DeviceStatus } from './UserModel'

interface NasLoginResponse {
  role: DeviceRole,
  status: DeviceStatus,
  // eslint-disable-next-line camelcase
  api_token: string,
  // eslint-disable-next-line camelcase
  refresh_token: string
}

export {
  NasLoginResponse
}
