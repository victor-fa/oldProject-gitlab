<template>
  <a-modal
    v-model="visible"
    class="new-custom-modal"
    :destroyOnClose="true"
    :afterClose="handleCloseAction"
  >
    <template slot="title">
      <p class="modal-title">新建模块</p>
    </template>
    <div class="modal-content">
      <div class="modal-cover">
        <span>相册封面</span>
        <a-button v-if="showCover" @click="handleCoverAction">
          <img src="../../assets/new_custom_icon.png" >
        </a-button>
        <img v-else class="cover-image" :src="imageData" @click="handleCoverAction">
      </div>
      <a-input placeholder="请输入模块名" v-model="name"/>
      <a-textarea placeholder="请填写简要叙述" :rows="3" v-model="desc"/>
    </div>
    <div slot="footer" class="modal-footer">
      <a-button class="cancel-btn" @click="handleCancelAction">取消</a-button>
      <a-button
        class="confirm-btn"
        :loading="loading"
        @click="handleConfirmAction"
        @keyup.enter="handleConfirmAction"
      >
        确定
      </a-button>
    </div>
  </a-modal>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import NasFileAPI from '../../api/NasFileAPI'
import { CustomInfo, CustomModule } from '../../api/NasFileModel'
import ImageUtility from '../../utils/ImageUtility'

export default Vue.extend({
  name: 'new-custom-modal',
  data () {
    return {
      visible: false,
      name: '',
      desc: '',
      loading: false,
      imageObj: null as object | null,
      imageData: '',
      item: null as CustomModule | null
    }
  },
  computed: {
    showCover: function () {
      const result: boolean = _.isEmpty(this.imageData)
      return result
    }
  },
  methods: {
    show (item?: CustomModule) {
      this.visible = true
      if (item === undefined) return
      this.item = item
      this.name = item.myself_folder.name
      this.desc = item.myself_folder.desc
      if (!_.isEmpty(item.myself_folder.background_path)) {
        this.imageData = item.myself_folder.image_path
      }
    },
    handleCloseAction () {
      this.name = ''
      this.desc = ''
      this.imageObj = null
      this.item = null
    },
    handleCoverAction () {
      this.showOpenDialog()
    },
    showOpenDialog () {
      const { dialog, BrowserWindow } = require('electron').remote
      dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
        filters: [ { name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] } ],
        buttonLabel: '选择',
        properties: ['openFile']
      }).then(result => {
        if (result.filePaths.length === 0) return
        const path = result.filePaths[0]
        ImageUtility.getImageBase64(path).then(data => {
          this.imageObj = data
          this.imageData = _.get(data, 'imageData')
        })
      })
    },
    handleCancelAction () {
      this.visible = false
      NasFileAPI.cancelCustomRequest()
    },
    handleConfirmAction () {
      const tip = this.checkInput()
      if (tip !== null) {
        this.$message.warning(tip)
        return
      }
      if (this.item === null) {
        this.creatCustomModule()
      } else {
        this.updateCustomModule()
      }
    },
    checkInput () {
      if (_.isEmpty(this.name)) {
        return '模块名不能为空'
      }
      if (_.isEmpty(this.desc)) {
        return '模块描述不能为空'
      }
      if (_.isEmpty(this.imageData)) {
        return '封面不能为空'
      }
      return null
    },
    creatCustomModule () {
      const info = {
        name: this.name,
        desc: this.desc
      } as CustomInfo
      this.loading = true
      NasFileAPI.newCustomFolder(info).then(response => {
        console.log(response)
        if (response.data.code !== 200) return Promise.reject(response.data.msg)
        const path = _.get(response.data.data, 'path')
        const uuid = _.get(response.data.data, 'uuid')
        const data = _.get(this.imageObj, 'base64')
        return NasFileAPI.uploadCustomCover(path, uuid, data)
      }).then(response => {
        this.loading = false
        console.log(response)
        if (response.data.code !== 200) return
        this.visible = false
        this.$emit('creatCompleted')
      }).catch(error => {
        console.log(error)
        this.loading = false
        if (!_.isString(error)) {
          this.$message.error('网络连接失败，请检测网络')
        }
      })
    },
    updateCustomModule () {
      this.loading = true
      const info = {
        name: this.name,
        desc: this.desc
      } as CustomInfo
      const path = this.item!.path
      const uuid = this.item!.uuid
      NasFileAPI.updateCustomInfo(path, uuid, info).then(response => {
        console.log(response)
        if (response.data.code !== 200) return Promise.reject(response.data.msg)
        if (this.imageObj === null) {
          const msg = 'not change'
          return Promise.reject(msg)
        }
        const data = _.get(this.imageObj, 'base64')
        return NasFileAPI.uploadCustomCover(path, uuid, data)
      }).then(response => {
        this.loading = false
        console.log(response)
        if (response.data.code !== 200) return
        this.visible = false
        this.$emit('creatCompleted')
      }).catch(error => {
        console.log(error)
        this.loading = false
        if (!_.isString(error)) {
          this.$message.error('网络连接失败，请检测网络')
        } else {
          this.visible = false
          this.$emit('creatCompleted')
        }
      })
    }
  }
})
</script>

<style lang="less" scoped>
.new-custom-modal {
  .modal-title {
    color: #353535;
    font-size: 13px;
    font-weight: bold;
  }
  .modal-content {
    .modal-cover {
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      span {
        color: #b3b6c5;
        font-size: 12px;
        font-weight: bold;
        padding-left: 8px;
      }
      .ant-btn {
        height: 48px;
        width: 48px;
        display: flex;
        justify-content: center;
        border-color: #dcdcdc;
        align-items: center;
        img {
          width: 20px;
        }
      }
      .ant-btn:focus {
        border-color: #dcdcdc;
      }
      .cover-image {
        max-height: 48px;
        max-width: 48px;
      }
    }
    input {
      height: 34px;
      margin-top: 7px;
      color: #353535;
      font-size: 12px;
      font-weight: 500;
    }
    textarea {
      resize: none;
      height: 64px;
      margin-top: 7px;
      color: #353535;
      font-size: 12px;
      font-weight: 500;
    }
  }
  .modal-footer {
    height: 56px;
    padding: 0px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .ant-btn {
      width: 90px;
      height: 26px;
      border-radius: 13px;
      color: white;
      font-size: 11px;
      font-weight: bold;
      border: none;
    }
    .cancel-btn {
      background-color: #b3b6c5;
    }
    .confirm-btn {
      background-color: #2cd18a;
    }
  }
}
</style>

<style>
.new-custom-modal {
  width: 286px !important;
}
.new-custom-modal .ant-modal-content {
  height: 266px;
}
.new-custom-modal .ant-modal-close-x {
  height: 40px;
  line-height: 40px;
  width: 40px;
}
.new-custom-modal .ant-modal-header {
  padding: 13px 24px 0px 13px;
  border-bottom: none;
}
.new-custom-modal .ant-modal-body {
  padding: 0px 18px;
}
.new-custom-modal .ant-modal-footer {
  border-top: none;
  padding: 0px;
}
</style>
