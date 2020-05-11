import UploadTask from './UploadTask'
import { AxiosResponse, CancelTokenSource } from 'axios';
import { BasicResponse } from '../UserModel';
import NasFileAPI from '../NasFileAPI';
import { UploadParams } from '../NasFileModel';
import { FileInfo } from './BaseTask';

export default class EncryptUploadTask extends UploadTask {
  uploadChunckData (file: FileInfo, data: Buffer, source?: CancelTokenSource): Promise<AxiosResponse<BasicResponse>> {
    const params = {} as UploadParams
    return NasFileAPI.uploadData(params, data, source)
  }
}
