import fs from 'fs'
import crypto from 'crypto'
import UploadTask from './UploadTask'
import { AxiosResponse, CancelTokenSource } from 'axios';
import { BasicResponse } from '../UserModel';
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';
import { FileInfo } from './BaseTask';

export default class BackupUploadTask extends UploadTask {
  icon = require('../../assets/resource/folder_icon.png')

  convertFileStats (path: string, stats: fs.Stats): Promise<FileInfo> {
    return new Promise(resolve => {
      let fileInfo: FileInfo | null = null
      super.convertFileStats(path, stats).then(info => {
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
  /**上传文件数据 */
  uploadChunckData (file: FileInfo, buffer: Buffer, source?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    const params = this.backupUploadParams(file, buffer.length) as UploadParams
    return NasFileAPI.uploadBackup(params, buffer, source)
  }
  /** 参数整理 */
  backupUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    const end = chunkLength === 0 ? chunkLength : fileInfo.completedSize + chunkLength - 1
    const hostname = require("os").hostname()
    return {
      end,
      path: '/' + fileInfo.destPath,
      start: fileInfo.completedSize,
      size: fileInfo.totalSize,
      md5: fileInfo.md5,
      alias: `${hostname}的${process.platform === 'win32' ? 'PC' : 'Mac'}`,
      id: fileInfo.md5
    }
  }
  /** 过滤（备份加密用） */
  filterFilesInfo(fileInfo: FileInfo): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      const pathP = fileInfo.destPath
      NasFileAPI.backupCheck(pathP, fileInfo.md5 as string).then(response => {
        if (response.data.code !== 200) return resolve(true)
        if (response.data.data.identical === 1) return resolve(true)
        return resolve(false)
      }).catch(error => {
        reject(error)
      })
    })
  }
}
