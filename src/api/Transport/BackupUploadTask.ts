import fs from 'fs'
import crypto from 'crypto'
import UploadTask, { FileInfo } from './UploadTask'
import { Canceler, AxiosResponse } from 'axios';
import { BasicResponse } from '../UserModel';
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';
import StringUtility from '../../utils/StringUtility'
import ClientAPI from '../ClientAPI'

export default class BackupUploadTask extends UploadTask {
  convertFileStats (path: string, stats: fs.Stats): Promise<FileInfo> {
    return new Promise((resolve, reject) => {
      let fileInfo: FileInfo | null = null
      super.convertFileStats(path, stats).then(info => {
        fileInfo = info
        return this.calculatorFileMD5(path)
      }).then(md5 => {
        fileInfo!.md5 = md5
        resolve(fileInfo!)
      }).catch(error => {
        reject(error)
      })
    })
  }
  calculatorFileMD5 (path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(path)
      const fsHash = crypto.createHash('md5')
      stream.on('data', data => {
        fsHash.update(data)
      })
      stream.once('end', () => {
        const md5 = fsHash.digest('hex')
        resolve(md5)
      })
      stream.once('error', error => {
        reject(error)
      })
    })
  }
  uploadChunckData (file: FileInfo, buffer: Buffer, cancel?: Canceler): Promise<AxiosResponse<BasicResponse>> {
    // temporary code
    const params = this.backupUploadParams(file, buffer.length) as UploadParams
    return NasFileAPI.uploadBackup(params, buffer, cancel)
  }
  backupUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    const hostName = require("os").hostname() + ClientAPI.getMac()
    return {
      path: '/' + StringUtility.convertR2L(hostName + '\\' + fileInfo.path),
      start: fileInfo.uploadedSize,
      end: fileInfo.uploadedSize + chunkLength - 1,
      size: fileInfo.totalSize,
      md5: fileInfo.md5,
      alias: hostName,
      id: fileInfo.md5
    }
  }
}
