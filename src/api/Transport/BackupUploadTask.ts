import fs from 'fs'
import crypto from 'crypto'
import UploadTask from './UploadTask'
import { AxiosResponse, CancelTokenSource } from 'axios';
import { BasicResponse } from '../UserModel';
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';
import StringUtility from '@/utils/StringUtility'
import ClientAPI from '../ClientAPI'
import { FileInfo } from './BaseTask';

let fileInfos: FileInfo[] = []

export default class BackupUploadTask extends UploadTask {
  /**转换stats */
  convertFileStats (path: string, stats: fs.Stats): Promise<FileInfo> {
    return new Promise(async resolve => {
      let fileInfo: FileInfo | null = null
      await super.convertFileStats(path, stats).then(info => {
        fileInfo = info
        if (!fileInfo.isDirectory) {
          return this.calculatorFileMD5(path)
        } else {
          return ''
        }
      }).then(md5 => {
        fileInfo!.md5 = md5
        resolve(fileInfo!)
      })
    })
  }
  // 计算文件的md5（不计算文件夹）
   calculatorFileMD5 (path: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const stream = fs.createReadStream(path)
      const fsHash = crypto.createHash('md5')
      await stream.on('data', data => {
        fsHash.update(data)
      })
      await stream.once('end', () => {
        const md5 = fsHash.digest('hex')
        resolve(md5)
      })
      await stream.once('error', error => {
        reject(error)
      })
    })
  }
  /**上传文件数据 */
  uploadChunckData (file: FileInfo, buffer: Buffer, source?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    const params = this.backupUploadParams(file, buffer.length) as UploadParams
    return NasFileAPI.uploadBackup(params, buffer, source)
  }
  /** 参数整理 */
  backupUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    const hostName = require("os").hostname() + ClientAPI.getMac()
    return {
      path: '/' + StringUtility.convertR2L(hostName + '\\' + fileInfo.srcPath),
      start: fileInfo.completedSize,
      end: fileInfo.completedSize + chunkLength - 1,
      size: fileInfo.totalSize,
      md5: fileInfo.md5,
      alias: hostName,
      id: fileInfo.md5
    }
  }
  /** 过滤（备份加密用） */
  filterFilesInfo(fileInfo: FileInfo): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      const pathP = fileInfo.destPath
      NasFileAPI.backupCheck(pathP, fileInfo.md5 as string).then(response => {
        if (response.data.code !== 200) return resolve(false)
        if (response.data.data.identical === 1) return resolve(false)
        return resolve(true)
      }).catch(error => {
        reject(error)
      })
    })
  }
}
