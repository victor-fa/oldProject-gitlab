import _ from 'lodash'
import { TransDownloadInfo, TransUploadInfo, TransBackupInfo } from '../../api/TransformModel'
import { TRANS_DOWNLOAD, TRANS_UPLOAD, TRANS_BACKUP } from '../../common/constants'
import { ActionContext } from 'vuex'

interface TransformState {
  downloadInfo?: TransDownloadInfo,
  uploadInfo?: TransUploadInfo,
  backupInfo?: TransBackupInfo
}

export default {
  namespaced: true,
  state: {
    downloadInfo: [],
    uploadInfo: [],
    backupInfo: []
  },
  getters: {
    downloadInfo: (state: TransformState) => {
      if (!_.isEmpty(state.downloadInfo)) {
        return state.downloadInfo
      }
      const downloadJson = localStorage.getItem(TRANS_DOWNLOAD)
      if (downloadJson !== null) {
        state.downloadInfo = JSON.parse(downloadJson)
        return state.downloadInfo
      }
      return []
    },
    uploadInfo: (state: TransformState) => {
      if (!_.isEmpty(state.uploadInfo)) {
        return state.uploadInfo
      }
      const uploadJson = localStorage.getItem(TRANS_UPLOAD)
      if (uploadJson !== null) {
        state.uploadInfo = JSON.parse(uploadJson)
        return state.uploadInfo
      }
      return []
    },
    backupInfo: (state: TransformState) => {
      if (!_.isEmpty(state.backupInfo)) {
        return state.backupInfo
      }
      const backupJson = localStorage.getItem(TRANS_BACKUP)
      if (backupJson !== null) {
        state.backupInfo = JSON.parse(backupJson)
        return state.backupInfo
      }
      return []
    },
  },
  mutations: {
    UPDATE_TRANS_DOWNLOAD (state: TransformState, downloadInfo: TransDownloadInfo) {
      state.downloadInfo = downloadInfo
    },
    UPDATE_TRANS_UPLOAD (state: TransformState, uploadInfo: TransUploadInfo) {
      state.uploadInfo = uploadInfo
    },
    UPDATE_TRANS_BACKUP (state: TransformState, backupInfo: TransBackupInfo) {
      state.backupInfo = backupInfo
    },
    SAVE_TRANS (state: TransformState) {
      localStorage.setItem(TRANS_DOWNLOAD, JSON.stringify(state.downloadInfo))
      localStorage.setItem(TRANS_UPLOAD, JSON.stringify(state.uploadInfo))
      localStorage.setItem(TRANS_BACKUP, JSON.stringify(state.backupInfo))
    },
    SAVE_TRANS_DOWNLOAD (state: TransformState) {
      localStorage.setItem(TRANS_DOWNLOAD, JSON.stringify(state.downloadInfo))
    },
    SAVE_TRANS_UPLOAD (state: TransformState) {
      localStorage.setItem(TRANS_UPLOAD, JSON.stringify(state.uploadInfo))
    },
    SAVE_TRANS_BACKUP (state: TransformState) {
      localStorage.setItem(TRANS_BACKUP, JSON.stringify(state.backupInfo))
    },
  },
  actions: {
    async updateTransDownloadInfo (context: ActionContext<TransformState, TransformState>, downloadInfo: TransDownloadInfo) {
      context.commit('UPDATE_TRANS_DOWNLOAD', downloadInfo)
    },
    async updateTransUploadInfo (context: ActionContext<TransformState, TransformState>, uploadInfo: TransUploadInfo) {
      context.commit('UPDATE_TRANS_UPLOAD', uploadInfo)
    },
    async updateTransBackupInfo (context: ActionContext<TransformState, TransformState>, backupInfo: TransBackupInfo) {
      context.commit('UPDATE_TRANS_BACKUP', backupInfo)
    },
    async saveTransInfo (context: ActionContext<TransformState, TransformState>) {
      context.commit('SAVE_TRANS')
    },
    async saveTransDownloadInfo (context: ActionContext<TransformState, TransformState>) {
      context.commit('SAVE_TRANS_DOWNLOAD')
    },
    async saveTransUploadInfo (context: ActionContext<TransformState, TransformState>) {
      context.commit('SAVE_TRANS_UPLOAD')
    },
    async saveTransBackupInfo (context: ActionContext<TransformState, TransformState>) {
      context.commit('SAVE_TRANS_BACKUP')
    }
  }
}
