import fs from 'fs'
import crypto from 'crypto'
import UploadTask from './UploadTask'
import { AxiosResponse, CancelTokenSource } from 'axios';
import { BasicResponse } from '../UserModel';
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';
import StringUtility from '../../utils/StringUtility'
import ClientAPI from '../ClientAPI'
import { FileInfo } from './BaseTask';

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
  uploadChunckData (file: FileInfo, buffer: Buffer, source?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    const params = this.backupUploadParams(file, buffer.length) as UploadParams
    return NasFileAPI.uploadBackup(params, buffer, source)
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
  // 深遍历目录文件
  deepTraverseDirectory (directory: string): Promise<FileInfo[]> {
    return new Promise((resolve, reject) => {
      let fileInfos: FileInfo[] = []
      fs.readdirSync(directory).forEach(async filename => {
        const path = StringUtility.convertR2L(directory + '/' + filename)
        const stats = fs.statSync(path)
        if (stats.isDirectory()) {
          await this.deepTraverseDirectory(path).then(files => {
            fileInfos = fileInfos.concat(files)
          })
        } else {
          await this.convertFileStats(path, stats).then(async fileInfo => {
            await this.getMd5(path).then(noRepeat => {
              if (noRepeat) {
                fileInfos.push(fileInfo)
              }
            })
          }).catch(error => {
            reject(error)
          })
        }
        if (fileInfos.length === 0) {
          console.log('需备份的文件为空');
        } else {
          resolve(fileInfos)
        }
      })
    })
  }
  // 获取md5
  getMd5 (path) {
    return new Promise((resolve, reject) => {
      this.calculatorFileMD5(path).then(md5 => {
        return this.checkPath(path, md5)
      }).then(noRepeat => {
        resolve(noRepeat)
      }).catch(error => {
        reject(error)
      })
    })
  }
  // 调接口检查是否重复
  checkPath (path, md5) {
    return new Promise((resolve, reject) => {
      const hostName = require("os").hostname() + ClientAPI.getMac()
      const pathP = '/' + StringUtility.convertR2L(hostName + '\\' + path)
      NasFileAPI.backupCheck(pathP, md5).then(response => {
        if (response.data.code !== 200) return resolve(false)
        if (response.data.data.identical === 1) return resolve(false)
        return resolve(true)
      }).catch(error => {
        reject(error)
      })
    })
  }
}
