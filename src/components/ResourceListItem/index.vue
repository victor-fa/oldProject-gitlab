<template>
  <div @click="handleItemClick($event)">
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
          :src="searchResourceIcon(model.type)"
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
          <img :src="searchResourceIcon(model.type)">
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
import { ArrangeWay, ResourceItem, ResourceType } from '../../api/NasFileModel'
import NasFileAPI from '../../api/NasFileAPI'
import ResourceHandler from '../../views/MainView/ResourceHandler'

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
      inputName: (this.model as ResourceItem).name
    }
  },
  watch: {
    showName: function (newValue: string) {
      this.inputName = newValue
    },
    model: function (newValue: ResourceItem) {
      this.inputName = newValue.name
    }
  },
  computed: {
    isHorizontalArrange: function () {
      return this.arrangeWay === ArrangeWay.horizontal
    },
    isOddStyle: function () {
      const myThis = this as any
      return myThis.index % 2
    }
  },
  mounted () {
    document.addEventListener('keyup', this.handleKeyupAction)
  },
  destroyed () {
    document.removeEventListener('keyup', this.handleKeyupAction)
  },
  methods: {
    handleKeyupAction (event: KeyboardEvent) {
      const code = event.code
      if (code === 'Enter') {
        if (this.isSelected === false) return
        event.stopPropagation()
        if (this.isRenaming === false) {
          this.$emit('callbackAction', 'enterRenaming', this.index)
          return
        }
        const item = this.model as ResourceItem
        if (_.isEmpty(item.uuid)) {
          this.handleNewFolderaAction(item)
        } else {
          this.handleRenameAction(item)
        }
      }
    },
    handleRenameAction (item: ResourceItem) {
      // not change
      if (this.model.name === this.inputName) {
        this.$emit('callbackAction', 'leaveRenaming', this.index)
        return
      }
      if (_.isEmpty(this.inputName) || this.inputName.indexOf('.') === 0) {
        const isDirectory = item.type === ResourceType.folder
        const tip = isDirectory ? '目录名不能为空' : '文件名不能为空'
        this.$message.error(tip)
        this.inputName = item.name
        const element = document.activeElement
        if (!_.isEmpty(element)) {
          this.$nextTick(() => {
            this.selectFileName(element as HTMLInputElement)
          })
        }
        return
      }
      this.$emit('callbackAction', 'renameRequest', this.index, this.inputName)
    },
    handleNewFolderaAction (item: ResourceItem) {
      if (_.isEmpty(this.inputName)) {
        this.$emit('callbackAction', 'leaveNewFolder', this.index)
        return
      }
      this.$emit('callbackAction', 'newFolderRequest', this.index, this.inputName)
    },
    searchResourceIcon (type: ResourceType) {
      return ResourceHandler.searchResourceIcon(type)
    },
    handleItemClick (event: MouseEvent) {
      if (this.isSelected) {
        event.stopPropagation()
      }
    },
    handleBlur (event: MouseEvent) {
      if (_.isEmpty(this.inputName)) {
        this.$emit('callbackAction', 'leaveNewFolder', this.index)
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
</style>
