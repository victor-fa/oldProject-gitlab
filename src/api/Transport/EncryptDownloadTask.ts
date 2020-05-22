// 下载任务类，支持断点下载
import _ from 'lodash'
import NasFileAPI from '../NasFileAPI'
import { CancelTokenSource } from 'axios'
import { DownloadParams } from '../NasFileModel'
import DownloadTask, { FileInfo } from './BaseTask'

export default class EncryptDownloadTask extends DownloadTask {
  downloadChunkData (fileInfo: FileInfo, source?: CancelTokenSource) {
    const params = this.generateDownloadParams(fileInfo)
    return NasFileAPI.encryptDownloadData(params, source)
  }
  // 生成下载请求参数
  generateDownloadParams (fileInfo: FileInfo): DownloadParams {
    return {
      uuid: this.uuid,
      path: fileInfo.srcPath,
      start: fileInfo.completedSize,
      end: fileInfo.completedSize + this.maxChunkSize
    }
  }
}
