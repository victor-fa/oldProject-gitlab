<template>
  <div
    @click="handleItemClick($event)"
  >
    <div
      v-if="isHorizontalArrange"
      class="horizontal-item"
      v-bind:class="{
        horizontalSelectedItem: isSelected,
        disableItem: isDisable
      }"
    >
      <div class="icon-wrapper">
        <img
          :src="showIcon"
          @error="handleErrorAction()"
          @click.stop.exact="singleClick()"
          @click.meta.stop="multipleClick()"
          @click.ctrl.stop="ctrlMultipleClick()"
          @click.shift.stop="shiftMultipleClick()"
          @dblclick.stop="doubleClick()"
          @contextmenu.prevent="contextMenuClick($event)"
        />
      </div>
      <div class="name-wrapper">
        <a-input
          v-if="isRenaming"
          ref="inputName"
          v-focus
          type="text"
          v-model="inputName"
          placeholder="请输入文件名"
          @blur="handleBlur($event)"
          @focus="handleFocus($event)"
        />
        <p
          v-else
          :title="showName"
          @click.stop.exact="singleClick()"
          @click.meta.stop="multipleClick()"
          @click.shift.stop="shiftMultipleClick()"
          @dblclick.stop="doubleClick()"
          @contextmenu.prevent="contextMenuClick($event)"
        >
          {{ showName }}
        </p>
      </div>
    </div>
    <div
      v-else
      class="vertical-item"
      draggable="true"
      v-bind:class="{
        verticalSelectedItem: isSelected,
        oddVerticalItem: isOddStyle,
        disableItem: model.disable 
      }"
      @click.stop.exact="singleClick()"
      @click.meta.stop="multipleClick()"
      @click.shift.stop="shiftMultipleClick()"
      @dblclick.stop="doubleClick()"
      @contextmenu.prevent.stop="contextMenuClick($event)"
    >
      <a-row
        type="flex"
        justify="space-around"
        align="middle"
      >
        <a-col :span="13">
          <img :src="showIcon">
          {{ showName }}
        </a-col>
        <a-col :span="6">{{ model.showMtime }}</a-col>
        <a-col :span="5">{{ model.showSize }}</a-col>
      </a-row>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { ArrangeWay, ResourceItem, ResourceType } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import ResourceHandler from '../../views/MainView/ResourceHandler'
import { nasServer } from '../../api/NasServer'
import { NasAccessInfo } from '../../api/ClientModel'
import path from 'path'
import fs from 'fs'
import processCenter, { EventName } from '../../utils/processCenter'

export default Vue.extend({
  name: 'resource-item',
  directives: {
    focus: {
      inserted: function (el) {
        el.focus()
      }
    }
  },
  props: {
    model: Object, // 数据模型
    index: Number, // item的标识符
    arrangeWay: { // 排列方式
      default: ArrangeWay.horizontal
    },
    isSelected: { // 如果单独在model中修改isSelected状态，是不会触发界面更新的
      default: false
    },
    isDisable: {
      default: false
    },
    isRenaming: {
      default: false
    },
    showName: {
      default: ''
    }
  },
  data () {
    return {
      inputName: this.model.name,
      showIcon: null as any
    }
  },
  watch: {
    showName: function (newValue: string) {
      this.inputName = newValue
    },
    model: function (newValue: ResourceItem) {
      this.inputName = newValue.name
      this.showIcon = this.calculateShowIcon()
    }
  },
  computed: {
    ...mapGetters('NasServer', ['accessInfo']),
    isHorizontalArrange: function () {
      return this.arrangeWay === ArrangeWay.horizontal
    },
    isOddStyle: function () {
      const myThis = this as any
      return myThis.index % 2
    }
  },
  mounted () {
    this.showIcon = this.calculateShowIcon()
    document.addEventListener('keydown', this.handleKeydownAction)
  },
  destroyed () {
    document.removeEventListener('keydown', this.handleKeydownAction)
  },
  methods: {
    calculateShowIcon () {
      const item = this.model as ResourceItem
      let icon = ResourceHandler.searchResourceIcon(item.type, item.path)
      if (this.arrangeWay === ArrangeWay.vertical) return icon
      if (item.path !== undefined && item.path.indexOf('.safe') > -1) return icon
      if (_.isEmpty(item.thumbs)) return icon
      const smallPath = item.thumbs[0]
      if (_.isEmpty(smallPath)) return icon
      icon = nasServer.defaults.baseURL
      if (icon === undefined) return icon
      const apiToken = (this.accessInfo as NasAccessInfo).api_token
      if (_.isEmpty(apiToken)) return icon
      icon += '/v1/file/http_download?'
      icon += `uuid=${item.uuid}&path=${encodeURIComponent(smallPath)}&api_token=${apiToken}`
      return icon
    },
    handleKeydownAction (event: KeyboardEvent) {
      if (this.isSelected === false) return
      const code = event.code
      if (code === 'Enter') {
        this.handleEnterAction(event)
      }
    },
    handleEnterAction (event: KeyboardEvent) {
      event.stopPropagation()
      event.preventDefault()
      if (this.isRenaming === false) {
        this.$emit('callbackAction', 'enterRenaming', this.index)
        // return
      } else {
        const input = (this.$refs.inputName as Vue).$el as HTMLInputElement
        input.blur()
      }
    },
    handleItemClick (event: MouseEvent) {
      if (this.isSelected) {
        event.stopPropagation()
      }
    },
    handleBlur (event: MouseEvent) {
      const item = this.model as ResourceItem
      if (_.isEmpty(item.uuid)) {
        this.handleNewFolderaAction(item)
      } else {
        this.handleRenameAction(item)
      }
    },
    handleNewFolderaAction (item: ResourceItem) {
      if (_.isEmpty(this.inputName)) {
        this.$emit('callbackAction', 'newFolderRequest', this.index, item.name)
        return
      }
      this.$emit('callbackAction', 'newFolderRequest', this.index, this.inputName)
    },
    handleRenameAction (item: ResourceItem) {
      // not change
      if (item.name === this.inputName) {
        this.$emit('callbackAction', 'leaveRenaming', this.index)
        return
      }
      if (_.isEmpty(this.inputName) || this.inputName.indexOf('.') === 0) {
        this.$emit('callbackAction', 'leaveRenaming', this.index)
        this.inputName = this.model.name
      } else {
        this.$emit('callbackAction', 'renameRequest', this.index, this.inputName)
      }
    },
    handleFocus (event: FocusEvent) {
      this.selectFileName(event.currentTarget as any)
      // 命名中的item必须是选中状态
      if (this.isSelected !== true) this.singleClick()
    },
    // 选中文件名称
    selectFileName (element: HTMLInputElement) {
      if (this.model.type === ResourceType.folder) {
        element.select()
      } else {
        const offset = this.inputName.lastIndexOf('.')
        element.selectionStart = 0
        element.selectionEnd = offset
      }
    },
    handleErrorAction () {
      this.showIcon = require('../../assets/img_placeholder.png')
    },
    singleClick () {
      if (this.model.disable) return
      this.$emit('callbackAction', 'singleSelection', this.index)
    },
    multipleClick () {
      if (this.model.disable) return
      this.$emit('callbackAction', 'commandSelection', this.index)
    },
    ctrlMultipleClick () {
      if (this.model.disable) return
      this.$emit('callbackAction', 'ctrlSelection', this.index)
    },
    shiftMultipleClick () {
      if (this.model.disable) return
      this.$emit('callbackAction', 'shiftSelection', this.index)
    },
    doubleClick () {
      if (this.model.disable) return
      this.$emit('callbackAction', 'doubleClick', this.index)
    },
    contextMenuClick (event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      if (this.model.disable) return
      this.$emit('callbackAction', 'contextMenu', this.index, event)
    },
    handleDragstartEvent (event: DragEvent) {
      event.preventDefault()
      event.stopPropagation()
      if (event.dataTransfer === null) return
      event.dataTransfer.dropEffect = 'copy'
      const url = 'https://image.baidu.com/search/down?tn=download&word=download&ie=utf8&fr=detail&url=https%3A%2F%2Ftimgsa.baidu.com%2Ftimg%3Fimage%26quality%3D80%26size%3Db9999_10000%26sec%3D1590816668066%26di%3Dc7b005c0666f9668a1c5ab445889e1d6%26imgtype%3D0%26src%3Dhttp%253A%252F%252Fa3.att.hudong.com%252F14%252F75%252F01300000164186121366756803686.jpg&thumburl=https%3A%2F%2Fss3.bdstatic.com%2F70cFv8Sh_Q1YnxGkpoWK1HF6hhy%2Fit%2Fu%3D2534506313%2C1688529724%26fm%3D26%26gp%3D0.jpg'
      processCenter.renderSend(EventName.drag, url)
    }
  }
})
</script>

<style lang="less" scoped>
.horizontal-item {
  width: 80px;
  height: 100px;
  overflow: hidden;
  .icon-wrapper {
    height: 75px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    img {
      max-width: 40px;
      max-height: 80px;
      margin: auto;
    }
  }
  .name-wrapper {
    height: 25px;
    display: flex;
    align-items: center;
    p {
      width: 100%;
      line-height: 16px;
      font-size: 12px;
      padding: 0px 3px;
      margin-bottom: 0px;
      border-radius: 4px;
      color: #484848;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    input {
      width: 100%;
      height: 20px;
      font-size: 12px;
      color: #484848;
      text-align: center;
      padding-left: 4px;
      padding-right: 4px;
    }
  }
}
.horizontalSelectedItem {
  // border-radius: 8px;
  // background-color: #def1ea;
  .icon-wrapper {
    background-color: #DEF1EA;
  }
  p {
    background-color: #DEF1EA;
  }
}
.vertical-item {
  color: #484848;
  font-size: 12px;
  text-align: left;
  background-color: white;
  img {
    width: 19px;
    height: 16px;
    margin: 10px 10px 10px 20px;
    vertical-align: middle;
  }
}
.verticalSelectedItem {
  background-color: #DEF1EA !important;
}
.oddVerticalItem {
  background-color: #FCFBFE;
}
.disableItem {
  cursor: not-allowed;
}
</style>

<style>
.ant-tooltip-inner {
  min-height: 16px;
  font-size: 12px;
  color: #484848;
  background-color: #f6f8fb;
  padding: 2px 6px;
}
.ant-tooltip-arrow {
  border-bottom-color: #eaebee !important;
}
.vertical-item .ant-col-13 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 20px;
}
</style>
