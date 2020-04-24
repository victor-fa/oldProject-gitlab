import { RemoteTask, RemoteTaskStatus } from '@/api/NasFileModel';
import { TransportModel } from './MainPage/TransportModel';
import { TransportStatus } from '@/model/categoryList';
import { ResourceType } from '../../api/NasFileModel'

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
  convertBackupTask (model): TransportModel {
    let total_size = 0
    let total_chunk = 0
    let total_speed = 0
    let NowTime = new Date().getTime() / 1000;
    model.files.forEach(item => {
      total_size += item.size
      total_chunk += item.chunk
      total_speed = Number(parseFloat((item.chunk / (NowTime - item.time)).toString()).toFixed(0))
    });
    return {
      id: model.id,
      status: this.convertBackupTaskStatus(total_chunk, total_size),
      type: ResourceType.folder,
      speed: this.formatSpeed(total_speed),
      total: this.formatMemory(total_size),
      progress: this.formatProgress(total_chunk, total_size),
      progressPercent: this.caculatePercent(total_chunk, total_size),
      sourcePath: model.path,
      destinationPath: model.path
    }
  },
  convertBackupTaskStatus (total_chunk: number, total_size: number): TransportStatus {
    return total_chunk / total_size === 1 ? TransportStatus.completed : TransportStatus.running
  },
  formatSpeed (speed: number) {
    const kByte = 1024
    const mByte = kByte * 1024
    const gByte = mByte * 1024
    if (speed < kByte) {
      return `${(speed).toFixed(2)}B/s`
    } else if (speed < mByte) {
      return `${(speed / kByte).toFixed(2)}K/s`
    } else if (speed < gByte) {
      return `${(speed / mByte).toFixed(2)}M/s`
    } 
    return `${(speed / gByte).toFixed(2)}G/s`
  },
  formatMemory (memory: number) {
    const kByte = 1024
    const mByte = kByte * 1024
    const gByte = mByte * 1024
    if (memory < kByte) {
      return `${(memory).toFixed(2)}B`
    } else if (memory < mByte) {
      return `${(memory / kByte).toFixed(2)}KB`
    } else if (memory < gByte) {
      return `${(memory / mByte).toFixed(2)}MB`
    } 
    return `${(memory / gByte).toFixed(2)}GB`
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
