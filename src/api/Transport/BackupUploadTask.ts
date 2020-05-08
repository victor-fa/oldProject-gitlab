import fs from 'fs'
import crypto from 'crypto'
import UploadTask, { FileInfo } from './UploadTask'
import { Canceler, AxiosResponse } from 'axios';
import { BasicResponse } from '../UserModel';
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';

export default class BackupUploadTask extends UploadTask {
  convertFileStats (path: string, stats: fs.Stats): FileInfo {
    const fileInfo = super.convertFileStats(path, stats)
    fileInfo.md5 = this.calculatorFileMD5(path) 
    return fileInfo
  }
  calculatorFileMD5 (path: string): string {
    const buffer = fs.readFileSync(path)
    const fsHash = crypto.createHash('md5')
    fsHash.update(buffer)
    return fsHash.digest('hex')
  }
  uploadChunckData (file: FileInfo, data: Buffer, cancel?: Canceler): Promise<AxiosResponse<BasicResponse>> {
    // temporary code
    const params = {} as UploadParams
    return NasFileAPI.uploadData(params, data, cancel)
  }
}
