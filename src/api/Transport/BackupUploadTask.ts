import UploadTask, { FileInfo } from './UploadTask'
import { Canceler, AxiosResponse } from 'axios';
import { BasicResponse } from '../UserModel';
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';

export default class BackupUploadTask extends UploadTask {
  uploadChunckData (file: FileInfo, data: Buffer, cancel?: Canceler): Promise<AxiosResponse<BasicResponse>> {
    // temporary code
    const params = {} as UploadParams
    return NasFileAPI.uploadData(params, data, cancel)
  }
}
