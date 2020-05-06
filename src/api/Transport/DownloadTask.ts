// 下载任务类，支持断点下载
import fs from 'fs'
import NasFileAPI from '../NasFileAPI'

enum DownloadStatus {
  pending,
  downloading,
  finished,
  error,
  cancel
}

export {
  DownloadStatus
}

/** 目前只支持下载文件，不支持文件夹下载 */
export default class DownloadTask {
  readonly path: string
  readonly uuid: string
  readonly destPath: string
  readonly maxDownloadSize = 1 * 1024 * 1024 // 单次最大下载字节数
  status = DownloadStatus.pending // 下载任务状态
  countOfBytes = 0 // 总字节数
  downloadBytes = 0 // 已下载字节数

  constructor (path: string, uuid: string, dest: string) {
    this.path = path
    this.uuid = uuid
    this.destPath = dest
  }
  // public methods
  start () {
    this.status = DownloadStatus.downloading
    this.downloadFile(this.path, this.uuid)
  }
  cancel () {

  }
  suspend () {

  }
  resume () {

  }
  // private methods
  // 递归下载单个文件
  private downloadFile (path: string, uuid: string) {
    if (this.status !== DownloadStatus.downloading) return
    const begin = this.downloadBytes
    const end = this.downloadBytes + this.maxDownloadSize
    NasFileAPI.downloadData(path, uuid, begin, end).then(response => {
      console.log(response)
    }).catch(error => {
      console.log(error)
    })
  }
}
