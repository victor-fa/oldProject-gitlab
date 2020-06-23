<template>
  <div class="offline-modal" @click="handleModalClick">
    <div
      class="modal-view"
      v-bind:class="{
        'show-offline-modal': !hideModal,
        'hide-offline-modal': hideModal
      }"
    >
      <span class="title">新建任务</span>
      <a-textarea class="text-input" v-model="sourcePath" placeholder="下载链接、BT文件、磁力链接"/>
      <div class="source-select">
        <span>选择种子:</span>
        <a-select class="source-type-select" placeholder="请选择种子文件" @change="handleSourceChange">
          <a-select-option value="local">本地种子文件</a-select-option>
          <a-select-option value="nas">NAS种子文件</a-select-option>
        </a-select>
      </div>
      <div class="save-select" @click="handleSaveAction">
        <span>下载至:</span>
        <file-select
          class="save-input"
          placeholder="请选择保存路径"
          :value="savePath"
        />
      </div>
      <div class="bottom">
        <a-button :loading="loading" @click="handleDownloadAction">下载</a-button>
        <a-button @click="handleCancelAction">取消</a-button>
      </div>
    </div>
  <select-file-path
    v-if="showSelectModal"
    title="选择"
    :listType="selectListType"
    v-on:dismiss="handleSelectModalDismiss"
  />
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import FileSelect from '../../../components/FileSelect/index.vue'
import SelectFilePath from '../../SelectFilePath/index.vue'
import { SelectListType } from '../../SelectFilePath/FileModalHandler'
import NasFileAPI from '../../../api/NasFileAPI'
import FileHandle from '../../../utils/FileHandle'
import { Stats } from 'fs'
import { User } from '../../../api/UserModel'

export default Vue.extend({
  name: 'new-offline-modal',
  components: {
    FileSelect,
    SelectFilePath
  },
  data () {
    return {
      savePath: '',
      saveUuid: '',
      sourcePath: '',
      sourceUuid: '',
      loading: false,
      hideModal: false,
      showSelectModal: false,
      selectListType: SelectListType.disk
    }
  },
  computed: {
    ...mapGetters('User', ['user']),
    showSourcePlaceholder: function () {
      const result: boolean = _.isEmpty(this.sourcePath)
      return result
    },
    showSourcePath: function () {
      const path: string = this.sourcePath
      return _.isEmpty(path) ? '请选择种子文件' : path
    }
  },
  methods: {
    handleSourceChange (key: string) {
      if (key === 'local') {
        this.showFileDialog()
      } else if (key === 'nas') {
        this.selectListType = SelectListType.bt
        this.showSelectModal = true
      }
    },
    handleSaveAction () {
      this.selectListType = SelectListType.disk
      this.showSelectModal = true
    },
    handleSelectModalDismiss (path?: string, uuid?: string) {
      this.showSelectModal = false
      if (path === undefined || uuid === undefined) return
      if (this.selectListType === SelectListType.bt) {
        this.sourcePath = path
        this.sourceUuid = uuid
      } else {
        this.savePath = path
        this.saveUuid = uuid
      }
    },
    handleDownloadAction () {
      const result = this.checkInputValue()
      if (result !== true) {
        this.$message.error(result)
        return
      }
      this.loading = true
      this.generateTaskParams().then(params => {
        return NasFileAPI.addOfflineTask(params)
      }).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.hidden()
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    handleCancelAction () {
      this.hidden()
    },
    handleModalClick (event: MouseEvent) {
      event.stopPropagation()
    },
    hidden () {
      this.hideModal = true
      setTimeout(() => {
        this.$emit('dismiss')
      }, 250);
    },
    showFileDialog () {
      const { dialog, BrowserWindow } = require('electron').remote
      dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
        filters: [{ name: 'Custom File Type', extensions: ['.torrent'] }],
        buttonLabel: '选择',
        properties: ['createDirectory', 'openFile']
      }).then(result => {
        console.log(result)
      })
    },
    checkInputValue () {
      if (_.isEmpty(this.sourcePath)) {
        return '请选择或输入种子链接'
      } else if (_.isEmpty(this.savePath)) {
        return '请选择保存路径'
      }
      return true
    },
    generateTaskParams (): Promise<FormData> {
      return new Promise((resolve, reject) => {
        const fromData = new FormData()
        fromData.append('uuid', this.saveUuid)
        fromData.append('path', this.savePath)
        const path = this.sourcePath
        if (this.validateHttpFormat(path)) { // HTTP
          fromData.append('type', '1')
          fromData.append('uri', path)
          resolve(fromData)
        } else if (this.validateFilePathFormat(path)) { // 本地BT
          this.readFileData(path).then(buffer => {
            fromData.append('type', '2')
            fromData.append('bt_file', buffer.toString())
            resolve(fromData)
          }).catch(error => {
            reject(error)
          })
        } else if (this.validateRemotePathFormat(path)) { // 远程BT
          fromData.append('type', '4')
          fromData.append('bt_uuid', this.sourceUuid)
          fromData.append('bt_path', this.sourcePath)
          resolve(fromData)
        } else if (this.validateMagnetURIFormat(path)) { // 磁力链接
          fromData.append('type', '8')
          fromData.append('uri', path)
          resolve(fromData)
        } else {
          reject(new Error('Path format error'))
        }
      })
    },
    validateHttpFormat(path: string) {
      const regExp = new RegExp(/^(http|https):\/\//, 'gi')
      return regExp.test(path)
    },
    validateFilePathFormat (path: string) {
      if (process.platform === 'darwin') {
        return _.startsWith(path, '/User')
      }
      const regExp = /^[A-Z]:\\/
      return regExp.test(path)
    },
    readFileData (path: string): Promise<Buffer> {
      return new Promise((resolve, reject) => {
        let fileStats: Stats
        FileHandle.statFile(path).then(stats => {
          fileStats = stats
          return FileHandle.openReadFileHandle(path)
        }).then(fd => {
          return FileHandle.readFile(fd, 0, fileStats.size)
        }).then(buffer => {
          resolve(buffer)
        }).catch(error => {
          reject(error)
        })
      })
    },
    validateRemotePathFormat (path: string) {
      const user = this.user as User
      const prefix = `/.ugreen_nas/${user.ugreenNo}/`
      return _.startsWith(path, prefix)
    },
    validateMagnetURIFormat (path: string) {
      const prefix = 'magnet:'
      return _.startsWith(path, prefix)
    }
  }
})
</script>

<style lang="less" scoped>
.offline-modal {
  width: 100vw;
  height: 100vh;
  position: absolute;
  left: 0px;
  top: 0px;
  background-color: rgba(0,0,0,0);
  display: flex;
  justify-content: center;
  align-items: center;
  .modal-view {
    height: 265px;
    width: 360px;
    padding: 18px;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #e5e5e5;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.25);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    .title {
      color: #010101;
      font-size: 14px;
      text-align: left;
      line-height: 14px;
    }
    .text-input {
      margin-top: 14px;
      height: 70px;
      border-radius: 2px;
      font-size: 13px;
      color: #484848;
      resize: none;
    }
    .source-select {
      margin-top: 20px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      span {
        color: black;
        font-size: 14px;
      }
      .source-input {
        line-height: 24px;
        height: 24px;
        width: 250px;
      }
    }
    .source-type-select {
      height: 24px;
      width: 250px;
      font-size: 13px;
    }
    .save-select {
      height: 24px;
      margin-top: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      span {
        color: black;
        font-size: 14px;
        line-height: 24px;
      }
      .save-input {
        height: 24px;
        width: 250px;
      }
    }
    .bottom {
      display: flex;
      margin-top: 20px;
      flex-direction: row-reverse;
      .ant-btn {
        margin-left: 15px;
      }
    }
  }
}
.show-offline-modal {
  animation: showAnimate .25s ease-in-out;
}
.hide-offline-modal {
  animation: hideAnimate .25s ease-in-out;
}
@keyframes showAnimate {
  0% { transform: scale(0.3); opacity: 0.3; };
  100% { transform: scale(1.0); opacity: 1.0; };
}
@keyframes hideAnimate {
  0% { transform: scale(1.0); opacity: 1.0; };
  100% { transform: scale(0.3); opacity: 0.3; };
}
</style>

<style>
.modal-view .source-select .ant-select-selection__rendered {
  height: 24px;
  line-height: 24px;
}
.modal-view .source-select .ant-select-selection {
  height: 24px;
  line-height: 24px;
}
</style>
