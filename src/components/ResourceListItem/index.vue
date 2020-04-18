<template>
  <div>
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
          @click.shift.stop="listMultipleClick()"
          @dblclick="doubleClick()"
          @contextmenu.prevent="contextMenuClick($event)"
        />
      </div>
      <a-input
        v-if="isRenaming"
        v-focus
        ref="nameInput"
        type="text"
        v-model="inputName"
        @blur="handleRename"
        @focus="handleFocus($event)"
        @pressEnter="handleRename"
      />
      <div v-else>
        <p
          :title="model.name"
          @click.stop.exact="singleClick()"
          @click.meta.stop="multipleClick()"
          @click.shift.stop="listMultipleClick()"
          @dblclick="doubleClick()"
          @contextmenu.prevent="contextMenuClick($event)"
        >
          {{ model.name }}
        </p>
      </div>
    </div>
    <div
      v-else
      class="vertical-item"
      v-bind:class="{
        oddVerticalItem: isOddStyle,
        verticalSelectedItem: isSelected, 
        disableItem: model.disable 
      }"
    >
      <a-row
        type="flex"
        justify="space-around"
        align="middle"
        @click.stop.exact="singleClick()"
        @click.meta.stop="multipleClick()"
        @click.shift.stop="shiftMultipleClick()"
        @dblclick="doubleClick()"
        @contextmenu.prevent.stop="contextMenuClick($event)"
      >
        <a-col :span="13">
          <img :src="searchResourceIcon(model.type)">
          {{ model.name }}
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
import StringUtility from '../../utils/StringUtility'
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
    }
  },
  data () {
    return {
      inputName: (this.model as ResourceItem).name
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
  methods: {
    searchResourceIcon (type: ResourceType) {
      return ResourceHandler.searchResourceIcon(type)
    },
    handleRename () {
      // not change
      if (this.model.name === this.inputName) return
      // TODO: 当前没有对文件名合法性进行校验
      const newPath = StringUtility.renamePath(this.model.path, this.inputName)
      this.$emit('callbackAction', 'rename', this.index, newPath)
    },
    handleFocus (event: FocusEvent) {
      // 输入框聚焦，选中名称字段
      const target = event.currentTarget as any
      if (this.model.type === ResourceType.folder) {
        target.select()
      } else {
        const offset = this.inputName.lastIndexOf('.')
        target.selectionStart = 0
        target.selectionEnd = offset
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
  cursor: pointer;
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
  p {
    margin-top: 6px;
    line-height: 14px;
    font-size: 12px;
    padding: 0px 3px;
    border-radius: 4px;
    color: #484848;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  input {
    margin: auto;
    height: 20px;
    font-size: 12px;
    color: #484848;
    text-align: center;
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
  cursor: pointer;
  img {
    width: 19px;
    height: 16px;
    margin: 10px 10px 10px 20px;
    vertical-align: middle;
  }
}
.verticalSelectedItem {
  background-color: #ececec;
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
