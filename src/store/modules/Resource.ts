import { ActionContext } from 'vuex'
import { StorageInfo, ResourceItem, EncryptInfo, ArrangeWay } from '@/api/NasFileModel'

interface ClipboardModel {
  isClip: boolean, // true 剪切，false 拷贝
  items: Array<ResourceItem>
}

export {
  ClipboardModel
}

interface ResourceState {
  storages: Array<StorageInfo>,
  showItemCount: number,
  clipboard: ClipboardModel,
  taskCount: number, // 传输中的任务数
  encryptInfos: EncryptInfo[],
  arrangeWay?: ArrangeWay
}

export default {
  namespaced: true,
  state: {
    storages: [],
    showItemCount: 0,
    clipboard: [], // TODO: 目前没有对剪切板进行缓存
    taskCount: 0,
    encryptInfos: [],
    arrangeWay: undefined
  },
  getters: {
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
    },
    encryptInfos: (state: ResourceState) => {
      return state.encryptInfos
    },
    arrangeWay: (state: ResourceState) => {
      if (state.arrangeWay !== undefined) return state.arrangeWay
      const way = localStorage.getItem('arrangeWay')
      const arrangeWay: ArrangeWay = way === null ? ArrangeWay.horizontal : Number(way)
      state.arrangeWay = arrangeWay
      return arrangeWay
    }
  },
  mutations: {
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
      if (adjust === -1) {
        state.taskCount === 0 ? null : state.taskCount = state.taskCount += adjust
      } else {
        state.taskCount += adjust
      }
    },
    CLEAR_TASK_COUNT (state: ResourceState) {
      state.taskCount = 0
    },
    UPDATE_ENCRYPT_INFOS (state: ResourceState, infos: EncryptInfo[]) {
      state.encryptInfos = infos
    },
    UPDATE_ARRANGE_WAY (state: ResourceState, way: ArrangeWay) {
      state.arrangeWay = way
      localStorage.setItem('arrangeWay', way.toString())
    }
  },
  actions: {
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
    },
    clearTaskCount (context: ActionContext<ResourceState, ResourceState>) {
      context.commit('CLEAR_TASK_COUNT')
    },
    updateEncryptInfos (context: ActionContext<ResourceState, ResourceState>, infos: EncryptInfo[]) {
      context.commit('UPDATE_ENCRYPT_INFOS', infos)
    },
    updateArrangeWay (context: ActionContext<ResourceState, ResourceState>, way: ArrangeWay) {
      context.commit('UPDATE_ARRANGE_WAY', way)
    }
  }
}
