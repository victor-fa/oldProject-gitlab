import _ from 'lodash'
import fs from 'fs'
import crypto from 'crypto'
import UploadTask from './UploadTask'
import { AxiosResponse, CancelTokenSource } from 'axios';
import { BasicResponse } from '../UserModel';
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';
import { CRYPTO_INFO } from '@/common/constants'
import { CryptoInfo } from '../ClientModel';
import { FileInfo } from './BaseTask';
import store from '@/store'
import { User } from '@/api/UserModel'
import path from 'path'

export default class EncryptUploadTask extends UploadTask {
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
  uploadChunckData (file: FileInfo, buffer: Buffer, source?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    const params = this.encryptUploadParams(file, buffer.length) as UploadParams
    return NasFileAPI.uploadEncrypt(params, buffer, source)
  }
  encryptUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    const cryptoJson = localStorage.getItem(CRYPTO_INFO)
    const user = _.get(store.getters, 'User/user') as User
    let token
    if (cryptoJson !== null) {
      token = JSON.parse(cryptoJson) as CryptoInfo
    }
    console.log(fileInfo);
    console.log(path.dirname(fileInfo.srcPath));
    return {
      // path: `/.ugreen_nas/${user.ugreenNo}/.safe/${fileInfo.name}`,
      path: `/.ugreen_nas/${user.ugreenNo}/.safe/${fileInfo.relativePath === '' ? fileInfo.name :  fileInfo.srcPath}`,
      start: fileInfo.completedSize,
      end: fileInfo.completedSize + chunkLength - 1,
      size: fileInfo.totalSize,
      md5: fileInfo.md5,
      crypto_token: token.crypto_token
    }
  }
}
