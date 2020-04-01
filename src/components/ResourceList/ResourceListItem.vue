<template>
  <div>
    <div
      v-if="isHorizontalArrange"
      class="horizontal-item"
      v-bind:class="{ horizontalSelectedItem: isSelected, disableItem: disable }"
    >
      <div class="icon-wrapper">
        <img
          :src="searchResourceIcon(itemModel.type)"
          @click.stop.exact="singleClick()"
          @click.meta.stop="multipleClick()"
          @click.shift.stop="listMultipleClick()"
          @dblclick="doubleClick()"
          @contextmenu.prevent="contextMenuClick($event)"
        />
      </div>
      <a-input
        v-if="renaming"
        v-focus
        ref="nameInput"
        type="text"
        :disabled="loading"
        v-model="inputName"
        @blur="handleRename"
        @focus="handleFocus($event)"
        @pressEnter="handleRename"
      />
      <div v-else>
        <a-tooltip placement="bottom">
          <template slot="title">
            <span>{{ itemModel.name }}</span>
          </template>
          <p
            @click.stop.exact="singleClick()"
            @click.meta.stop="multipleClick()"
            @click.shift.stop="listMultipleClick()"
            @dblclick="doubleClick()"
            @contextmenu.prevent="contextMenuClick($event)"
          >
            {{ itemModel.name }}
          </p>
        </a-tooltip>
      </div>
    </div>
    <div
      v-else
      class="vertical-item"
      v-bind:class="{ oddVerticalItem: isOddStyle, verticalSelectedItem: isSelected, disableItem: disable }"
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
          <img :src="searchResourceIcon(itemModel.type)">
          {{ itemModel.name }}
        </a-col>
        <a-col :span="6">{{ itemModel.showMtime }}</a-col>
        <a-col :span="5">{{ itemModel.showSize }}</a-col>
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
    model: Object,
    index: Number,
    isSelected: {
      default: false
    },
    disable: { // 禁用item的交互
      default: false
    },
    arrangeWay: {
      required: true,
      type: Number,
      validator: (value) => {
        return [ArrangeWay.horizontal, ArrangeWay.vertical].indexOf(value) !== -1
      }
    }
  },
  data () {
    let item = this.model as ResourceItem
    return {
      itemModel: item,
      renaming: false,
      inputName: item.name,
      loading: false
    }
  },
  watch: {
    model: function (newValue) {
      this.itemModel = newValue
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
      switch (type) {
        case ResourceType.video:
          return require('../../assets/resource/video_icon.png')
        case ResourceType.audio:
          return require('../../assets/resource/audio_icon.png')
        case ResourceType.image:
          return require('../../assets/resource/image_icon.png')
        case ResourceType.document:
          return require('../../assets/resource/txt_icon.png')
        case ResourceType.archive:
          return require('../../assets/resource/pdf_icon.png')
        case ResourceType.folder:
          return require('../../assets/resource/folder_icon.png')
      }
      return require('../../assets/resource/unkonw_icon.png')
    },
    handleRename () {
      // not change
      if (this.itemModel.name === this.inputName) { 
        this.renaming = false
        return
      }
      this.loading = true
      // TODO: 当前没有对文件名合法性进行校验
      const newPath = StringUtility.renamePath(this.itemModel.path, this.inputName)
      NasFileAPI.renameResource(this.itemModel.path, newPath, this.itemModel.uuid).then(response => {
        this.loading = false
        console.log(response)
        if (response.data.code !== 200) return
        this.renaming = false
      }).catch(error => {
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    handleFocus (event: FocusEvent) {
      // 输入框聚焦，选中名称字段
      const target = event.currentTarget as any
      if (this.itemModel.type === ResourceType.folder) {
        target.select()
      } else {
        const offset = this.inputName.lastIndexOf('.')
        target.selectionStart = 0
        target.selectionEnd = offset
      }
    },
    beginRenaming () {
      this.renaming = true
    },
    singleClick () {
      if (this.itemModel.disable) return
      this.$emit('singleSelectClick', this.index)
    },
    multipleClick () {
      if (this.itemModel.disable) return
      this.$emit('multipleSelectClick', this.index)
    },
    shiftMultipleClick () {
      if (this.itemModel.disable) return
      this.$emit('listMultipleSelectClick', this.index)
    },
    doubleClick () {
      if (this.itemModel.disable) return
      this.$emit('doubleClick', this.index)
    },
    contextMenuClick (event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      if (this.itemModel.disable) return
      this.$emit('contextMenuClick', event, this.index)
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
    background-color: #ececec;
  }
  p {
    background-color: #3888ff;
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
