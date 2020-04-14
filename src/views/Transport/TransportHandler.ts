import { RemoteTask, RemoteTaskStatus } from '@/api/NasFileModel';
import { TransportModel } from './MainPage/TransportModel';
import { TransportStatus } from '@/model/categoryList';

export default {
  convertRemoteTask (model: RemoteTask): TransportModel {
    return {
      id: model.id,
      status: this.convertRemoteTaskStatus(model.status),
      type: model.type,
      speed: this.formatSpeed(model.speed),
      total: this.formatMemory(model.total_size),
      progress: this.formatProgress(model.curr_size, model.total_size),
      progressPercent: this.caculatePercent(model.curr_size, model.total_size),
      sourcePath: model.curr_src_path,
      destinationPath: model.curr_dst_path 
    }
  },
  convertRemoteTaskStatus (status: RemoteTaskStatus): TransportStatus {
    if (status === RemoteTaskStatus.completed || status === RemoteTaskStatus.error) {
      return TransportStatus.completed
    }
    return TransportStatus.running
  },
  formatSpeed (speed: number) {
    const kByte = 1024
    const mByte = kByte * 1024
    const gByte = mByte * 1024
    if (speed < kByte) {
      return `${speed}B/s`
    } else if (speed < mByte) {
      return `${speed / kByte}K/s`
    } else if (speed < gByte) {
      return `${speed / mByte}M/s`
    } 
    return `${speed / gByte}G/s`
  },
  formatMemory (memory: number) {
    const kByte = 1024
    const mByte = kByte * 1024
    const gByte = mByte * 1024
    if (memory < kByte) {
      return `${memory}B`
    } else if (memory < mByte) {
      return `${memory / kByte}KB`
    } else if (memory < gByte) {
      return `${memory / mByte}MB`
    } 
    return `${memory / gByte}GB`
  },
  formatProgress (size: number, totalSize: number) {
    const formatSize = this.formatMemory(size)
    const formatTotal = this.formatMemory(totalSize)
    return `${formatSize}/${formatTotal}`
  },
  caculatePercent (size: number, total: number) {
    return (size / total) * 100
  }
}
