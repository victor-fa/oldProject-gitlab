import _ from 'lodash'
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';
import { FileInfo } from './BaseTask';
import ClientAPI from '@/api/ClientAPI'
import StringUtility from '@/utils/StringUtility';
import EncryptUploadTask from './EncryptUploadTask';

export default class BackupUploadTask extends EncryptUploadTask {
  icon = require('../../assets/resource/folder_icon.png')
  constructor (srcPath: string, destPath: string, uuid: string) {
    super(srcPath, destPath, uuid)
    this.type = 'backupUpload'
  }
  uploadChunkRequest (file: FileInfo, buffer: Buffer) {
    const params = this.backupUploadParams(file, buffer.length)
    return NasFileAPI.uploadBackup(params, buffer, this.source)
  }
  /** 参数整理 */
  backupUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    const end = chunkLength === 0 ? chunkLength : fileInfo.completedSize + chunkLength - 1
    const hostname = require("os").hostname()
    const mac = StringUtility.replaceString(ClientAPI.getMac(), ":", '')
    return {
      end,
      path: fileInfo.destPath,
      start: fileInfo.completedSize,
      size: fileInfo.totalSize,
      md5: fileInfo.md5,
      alias: `来自${hostname}-${process.platform === 'win32' ? 'PC' : 'Mac'}的备份`,
      id: hostname + mac
    }
  }
  /** 过滤（备份加密用） */
  filterFilesInfo(file: FileInfo): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      if (file.isDirectory || file.md5 === undefined) {
        resolve(true)
        return
      }
      NasFileAPI.backupCheck(file.destPath, file.md5).then(response => {
        console.log(response)
        if (response.data.code !== 200) {
          resolve(false)
        } else if (response.data.data.identical === 1) {
          resolve(true)
        } else {
          resolve(false)
        }
      }).catch(error => {
        console.log(error)
        reject(error)
      })
    })
  }
}
