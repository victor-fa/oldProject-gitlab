interface TransDownloadInfo {
  id: number,
  url: string,
  time: string,
  uuid: string,
  name: string,
  filePath: string,
  path: string,
  chunk: number,
  size: number,
  trans_type: string,
  state: string,
  disk_main: string,
  canResume: string,
  shows: boolean
}
interface TransUploadInfo {
  id: number,
  url: string,
  time: string,
  uuid: string,
  name: string,
  filePath: string,
  path: string,
  chunk: number,
  size: number,
  trans_type: string,
  state: string,
  disk_main: string,
  canResume: string,
  shows: boolean
}
interface TransBackupInfo {
  id: number,
  url: string,
  time: string,
  uuid: string,
  name: string,
  filePath: string,
  path: string,
  chunk: number,
  size: number,
  trans_type: string,
  state: string,
  disk_main: string,
  canResume: string,
  shows: boolean
}

export {
  TransDownloadInfo,
  TransUploadInfo,
  TransBackupInfo
}
