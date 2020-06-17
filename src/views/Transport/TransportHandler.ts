import _ from 'lodash'
import { RemoteTask, RemoteTaskStatus, ResourceType } from '@/api/NasFileModel';
import { TransportModel, TransportStatus, runningOperateItems, continueItem, completedOperateItems, refreshItem } from './MainPage/TransportModel';
import BaseTask, { TaskStatus } from '@/api/Transport/BaseTask';
import StringUtility from '@/utils/StringUtility';
import ResourceHandler from '../MainView/ResourceHandler'

export default {
  convertRemoteTask (model: RemoteTask): TransportModel {
    const status = this.convertRemoteTaskStatus(model.status)
    const items = this.generateItemsForStatus(status)
    const category = this.convertTaskStatus(status)
    return {
      id: model.id,
      status,
      category,
      speed: this.formatSpeed(model.speed),
      total: this.formatMemory(model.total_size),
      progress: this.formatProgress(model.curr_size, model.total_size),
      progressPercent: this.caculatePercent(model.curr_size, model.total_size),
      name: StringUtility.formatName(model.curr_src_path),
      icon: ResourceHandler.searchResourceIcon(ResourceType.document, model.curr_src_path),
      controlItems: items,
      path: model.curr_src_path,
      uuid: model.curr_src_uuid
    }
  },
  convertRemoteTaskStatus (status: RemoteTaskStatus): TaskStatus {
    switch (status) {
      case RemoteTaskStatus.prerunning:
        return TaskStatus.pending
      case RemoteTaskStatus.running:
        return TaskStatus.progress
      case RemoteTaskStatus.error:
        return TaskStatus.error
      case RemoteTaskStatus.pause:
        return TaskStatus.suspend
      case RemoteTaskStatus.completed:
        return TaskStatus.finished
    }
  },
  convertTaskStatus (status: TaskStatus): TransportStatus {
    if (status === TaskStatus.finished) return TransportStatus.done
    return TransportStatus.doing
  },
  convertBackupTask (model): TransportModel {
    return {} as TransportModel
  },
  formatSpeed (speed: number) {
    const kByte = 1024
    const mByte = kByte * 1024
    const gByte = mByte * 1024
    if (speed < kByte) {
      return `${(speed).toFixed(1)}B/s`
    } else if (speed < mByte) {
      return `${(speed / kByte).toFixed(1)}K/s`
    } else if (speed < gByte) {
      return `${(speed / mByte).toFixed(1)}M/s`
    } 
    return `${(speed / gByte).toFixed(1)}G/s`
  },
  formatMemory (memory: number) {
    const kByte = 1024
    const mByte = kByte * 1024
    const gByte = mByte * 1024
    if (memory < kByte) {
      return `${(memory).toFixed(1)}B`
    } else if (memory < mByte) {
      return `${(memory / kByte).toFixed(1)}KB`
    } else if (memory < gByte) {
      return `${(memory / mByte).toFixed(1)}MB`
    } 
    return `${(memory / gByte).toFixed(1)}GB`
  },
  formatProgress (size: number, totalSize: number) {
    const formatSize = this.formatMemory(size)
    const formatTotal = this.formatMemory(totalSize)
    return `${formatSize}/${formatTotal}`
  },
  caculatePercent (size: number, total: number) {
    return (size / total) * 100
  },
  convertTask<T extends BaseTask> (task: T) {
    const total = this.formatMemory(task.countOfBytes)
    const progress = this.formatProgress(task.completedBytes, task.countOfBytes)
    const progressPercent = this.caculatePercent(task.completedBytes, task.countOfBytes)
    const items = this.generateItemsForStatus(task.status)
    const model: TransportModel = {
      id: task.taskId,
      status: task.status,
      category: this.convertTaskStatus(task.status),
      icon: task.icon,
      speed: task.speed,
      total,
      progress,
      progressPercent,
      name: task.name,
      controlItems: items,
      path: task.srcPath,
      uuid: task.uuid
    }
    return model
  },
  generateItemsForStatus (status: TaskStatus) {
    const doingItems = _.cloneDeep(runningOperateItems)
    switch (status) {
      case TaskStatus.pending:
        return doingItems.map((item, index) => {
          item.disable = index === 0
          return item
        })
      case TaskStatus.progress:
        return doingItems
      case TaskStatus.suspend:
        return doingItems.map((item, index) => {
          return index === 0 ? _.clone(continueItem) : item
        })
      case TaskStatus.finished:
        return _.cloneDeep(completedOperateItems)
      case TaskStatus.error:
        return doingItems.map((item, index) => {
          return index === 0 ? _.clone(refreshItem) : item
        })
    }
  },
  searchModel (array: TransportModel[], id: number) {
    for (let index = 0; index < array.length; index++) {
      const model = array[index]
      if (model.id === id) return index
    }
  }
}
