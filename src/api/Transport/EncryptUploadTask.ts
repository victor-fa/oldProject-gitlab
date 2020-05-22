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

export default class EncryptUploadTask extends UploadTask {
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
    return {
      path: `/.ugreen_nas/${user.ugreenNo}/.safe/${fileInfo.name}`,
      // path: '/' + fileInfo.name,
      start: fileInfo.completedSize,
      end: fileInfo.completedSize + chunkLength - 1,
      size: fileInfo.totalSize,
      md5: fileInfo.md5,
      crypto_token: token.crypto_token
    }
  }
}
