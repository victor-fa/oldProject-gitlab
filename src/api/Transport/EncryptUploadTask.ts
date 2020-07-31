import _ from 'lodash'
import fs from 'fs'
import axios from 'axios'
import UploadTask from './UploadTask'
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';
import { FileInfo, TaskErrorCode, TaskStatus } from './BaseTask';
import store from '@/store';
import { CryptoInfo } from '../ClientModel';
import FileHandle, { FileHandleError } from '@/utils/FileHandle';

export default class EncryptUploadTask extends UploadTask {
  constructor (srcPath: string, destPath: string, uuid: string) {
    super(srcPath, destPath, uuid)
    this.type = 'encryptUpload'
  }
  splitFileChunks (totalSize: number) {
    return undefined
  }
  createFolderRequest (file: FileInfo) {
    return NasFileAPI.newFolderEncrypt(file.destPath, this.uuid)
  }
  startFileUpload (file: FileInfo) {
    if (this.status !== TaskStatus.progress) return
    FileHandle.openReadFileHandle(file.srcPath).then(fd => { // 1. open file handle success
      if (this.status !== TaskStatus.progress) return
      this.fileHandle = fd
      this.recursionUploadChunk(fd, file)
    }).catch(error => {
      console.log(error)
      if (this.fileHandle !== -1) FileHandle.closeFileHandle(this.fileHandle)
      if (_.get(error, 'message') === 'cancel') return
      this.handlerTaskError(TaskErrorCode.openHandleError)
    })
  }
  endFileUpload (fd: number, file: FileInfo) {
    if (this.buffer !== undefined) this.buffer = undefined
    FileHandle.closeFileHandle(fd).then(() => {
      this.fileHandle = -1
      if (this.fileInfos.length > 1) this.emit('fileFinished', this.taskId)
      this.uploadFile()
    }).catch(error => {
      console.log(error)
      this.handlerTaskError(TaskErrorCode.closeHandleError)
    })
  }
  private recursionUploadChunk (fd: number, file: FileInfo) {
    let chunkLength = 0
    this.readFileChunkData(fd, file.completedSize, this.maxChunkSize).then(bytes => {
      if (this.buffer === undefined) return Promise.reject(FileHandleError.closeError)
      if (this.status !== TaskStatus.progress) return Promise.reject(new Error('cancel'))
      const buffer = this.buffer!.slice(0, bytes)
      chunkLength = bytes
      return this.uploadChunkRequest(file, buffer)
    }).then(response => {
      if (this.status !== TaskStatus.progress) return
      if (response.data.code !== 200) {
        this.handlerTaskError(TaskErrorCode.serverError, response.data.msg) 
      } else {
        file.completedSize += chunkLength
        this.completedBytes += chunkLength
        this.emit('progress', this.taskId)
        if (file.completedSize < file.totalSize) {
          this.recursionUploadChunk(fd, file)
        } else {
          file.completed = true
          this.endFileUpload(fd, file)
        }
      }
    }).catch(error => {
      console.log(error)
      if (this.buffer !== undefined) this.buffer = undefined
      if (_.get(error, 'message') === 'cancel' || axios.isCancel(error)) return
      const code = error === FileHandleError.readError ? TaskErrorCode.readDataError : TaskErrorCode.serverError
      this.handlerTaskError(code)
    })
  }
  protected uploadChunkRequest (file: FileInfo, buffer: Buffer) {
    const params = this.encryptUploadParams(file, buffer.length)
    return NasFileAPI.uploadEncrypt(params, buffer, this.source)
  }
  private readFileChunkData (fd: number, position: number, length: number): Promise<number> {
    if (this.buffer === undefined) this.buffer = Buffer.alloc(this.maxChunkSize, 0, 'binary')
    return new Promise((resolve, reject) => {
      fs.read(fd, this.buffer!, 0, length, position, (error, bytes) => {
        if (error === null) {
          resolve(bytes)
        } else {
          console.log(error)
          reject(FileHandleError.readError)
        }
      })
    })
  }
  private encryptUploadParams (fileInfo: FileInfo, chunkLength: number): UploadParams {
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
