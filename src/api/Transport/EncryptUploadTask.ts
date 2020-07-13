import _ from 'lodash'
import fs from 'fs'
import crypto from 'crypto'
import UploadTask from './UploadTask'
import { AxiosResponse, CancelTokenSource } from 'axios';
import { BasicResponse } from '../UserModel';
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';
import { FileInfo } from './BaseTask';
import store from '@/store';
import { CryptoInfo } from '../ClientModel';

export default class EncryptUploadTask extends UploadTask {
  constructor (srcPath: string, destPath: string, uuid: string) {
    super(srcPath, destPath, uuid)
    this.type = 'encryptUpload'
  }
  
  calculateFileMD5 (path: string): Promise<string> {
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
  createFolder (fileInfo: FileInfo) {
    this.name = fileInfo.relativePath
    if (this.fileInfos.length > 1) this.emit('fileBegin', this.taskId, fileInfo)
    this.completedBytes += fileInfo.totalSize
    const uuid = _.isEmpty(this.uuid) ? undefined : this.uuid
    NasFileAPI.newFolderEncrypt(fileInfo.destPath, uuid).then(response => {
      console.log(response)
      fileInfo.completed = true
      if (this.fileInfos.length > 1) this.emit('fileFinished', this.taskId, _.cloneDeep(fileInfo))
      this.uploadFile()
    }).catch(_ => {
      fileInfo.completed = true
      this.uploadFile()
    })
  }
  uploadChunckData (file: FileInfo, buffer: Buffer, source?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    const params = this.encryptUploadParams(file, buffer.length) as UploadParams
    return NasFileAPI.uploadEncrypt(params, buffer, source)
  }
  encryptUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
    const crypto =  _.get(store.getters, 'NasServer/cryptoInfo') as CryptoInfo
    const end = chunkLength === 0 ? chunkLength : fileInfo.completedSize + chunkLength - 1
    return {
      end,
      path: fileInfo.destPath,
      start: fileInfo.completedSize,
      size: fileInfo.totalSize,
      md5: fileInfo.md5,
      crypto_token: crypto.crypto_token
    }
  }
}
