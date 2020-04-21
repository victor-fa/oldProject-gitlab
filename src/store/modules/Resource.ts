import { ActionContext } from 'vuex'
import { StorageInfo, ResourceItem } from '@/api/NasFileModel'

interface ClipboardModel {
  isClip: boolean, // true 剪切，false 拷贝
  items: Array<ResourceItem>
}

export {
  ClipboardModel
}

interface ResourceState {
  directory: string,
  storages: Array<StorageInfo>,
  showItemCount: number,
  clipboard: ClipboardModel,
  taskCount: number // 传输中的任务数
}

export default {
  namespaced: true,
  state: {
    directory: '最近',
    storages: [],
    showItemCount: 0,
    clipboard: [], // TODO: 目前没有对剪切板进行缓存
    taskCount: 0
  },
  getters: {
    directory: (state: ResourceState) => {
      return state.directory
    },
    storages: (state: ResourceState) => {
      return state.storages
    },
    showItemCount: (state: ResourceState) => {
      return state.showItemCount
    },
    clipboard: (state: ResourceState) => {
      return state.clipboard
    },
    taskCount: (state: ResourceState) => {
      return state.taskCount
    } 
  },
  mutations: {
    PUSH_PATH (state: ResourceState, path: string) {
      state.directory += `/${path}`
    },
    POP_PATH (state: ResourceState) {
      const length = state.directory.lastIndexOf('/')
      state.directory = state.directory.substring(0, length)
    },
    UPDATE_PATH (state: ResourceState, path: string) {
      state.directory = path
    },
    UPDATE_STORAGES (state: ResourceState, storages: Array<StorageInfo>) {
      state.storages = storages
    },
    UPDATE_SHOW_ITEM_COUNT (state: ResourceState, count: number) {
      state.showItemCount = count
    },
    UPDATE_CLIPBOARD (state: ResourceState, clipboard: ClipboardModel) {
      state.clipboard = clipboard
    },
    UPDATE_TASK_COUNT (state: ResourceState, adjust: number) {
      state.taskCount += adjust
    }
  },
  actions: {
    pushPath (context: ActionContext<ResourceState, ResourceState>, path: string) {
      context.commit('PUSH_PATH', path)
    },
    popPath (context: ActionContext<ResourceState, ResourceState>) {
      context.commit('POP_PATH')
    },
    updatePath (context: ActionContext<ResourceState, ResourceState>, path: string) {
      context.commit('UPDATE_PATH', path)
    },
    updateStorages (context: ActionContext<ResourceState, ResourceState>, storages: StorageInfo[]) {
      context.commit('UPDATE_STORAGES', storages)
    },
    updateShowItemCount (context: ActionContext<ResourceState, ResourceState>, count: number) {
      context.commit('UPDATE_SHOW_ITEM_COUNT', count)
    },
    updateClipboard (context: ActionContext<ResourceState, ResourceState>, clipboard: ClipboardModel) {
      context.commit('UPDATE_CLIPBOARD', clipboard)
    },
    increaseTask (context: ActionContext<ResourceState, ResourceState>) {
      context.commit('UPDATE_TASK_COUNT', 1)
    },
    decreaseTask (context: ActionContext<ResourceState, ResourceState>) {
      context.commit('UPDATE_TASK_COUNT', -1)
    }
  }
}
