<template>
  <div>
    <slot name="resourceHeader">
      <resource-header v-if="isShowHeader"/>
    </slot>
    <div
      class="resource-list"
      v-bind:class="{
        horizontalResourceList: !isShowHeader,
        'drag-style': dragState
      }"
      :style="{ height: scrollHeight + 'px' }"
      v-infinite-scroll="handleInfiniteOnLoad"
      :infinite-scroll-disabled="busy"
      :infinite-scroll-distance="0"
      :infinite-scroll-immediate-check="false"
      @contextmenu.prevent="handleListContextMenu"
      @click.stop="handleListClick"
      @drop.prevent="handleDropEvent($event)"
      @dragover.prevent="handleDragoverEvent($event)"
      @dragenter.prevent="handleDragEnterEvent($event)"
      @dragleave.prevent="handleDragLeaveEvent($event)"
    >
      <a-list
        :dataSource="dataSource"
        :grid="grid"
      >
        <a-list-item
          slot="renderItem"
          slot-scope="item, index"
        >
          <slot
            name="resourceItem"
            :item="item"
            :index="index"
            :arrangeWay="arrangeWay"
          />
        </a-list-item>
      </a-list>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import infiniteScroll from 'vue-infinite-scroll'
import { EventBus, EventType } from '@/utils/eventBus'
import processCenter, { EventName } from '@/utils/processCenter'
import StringUtility from '@/utils/StringUtility'
import { ArrangeWay, ResourceType, ResourceItem } from '@/api/NasFileModel'
import ResourceHeader from './ResourceHeader.vue'
import { SortWay } from '@/model/sortList'

export default Vue.extend({
  name: 'resource-list',
  directives: { infiniteScroll },
  components: {
    ResourceHeader
  },
  props: {
    customGrid: Object,
    dataSource: Array,
    busy: { // 是否处理加载更多回调
      default: true
    },
    arrangeWay: {
      default: ArrangeWay.horizontal
    },
    adjust: {
      default: 123
    }
  },
  data () {
    return {
      dragState: false,
      scrollHeight: document.body.clientHeight - this.adjust
    }
  },
  watch: {
    arrangeWay: function (newValue: ArrangeWay) {
      const adjust = newValue === ArrangeWay.horizontal ? 28 : -28
      this.scrollHeight += adjust
    }
  },
  computed: {
    grid: function () {
      const grid = this.customGrid as object
      if (!_.isEmpty(grid)) return grid
      if (this.arrangeWay === ArrangeWay.horizontal) {
        return { gutter: 16, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, xxl: 24 }
      }
      return { gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }
    },
    isShowHeader: function () {
      if (this.arrangeWay === ArrangeWay.vertical) return true
      return false
    },
    isSupportDrag: function () {
      const name = this.$route.name as string
      return name === 'main-resource-view' || name === 'custom'
    }
  },
  mounted () {
    window.addEventListener('resize', this.observerWindowResize)
    document.addEventListener('keydown', this.handleKeydownAction)
  },
  destroyed () {
    window.removeEventListener('resize', this.observerWindowResize)
    document.removeEventListener('keydown', this.handleKeydownAction)
  },
  methods: {
    observerWindowResize () {
      let height = document.body.clientHeight - this.adjust
      if (this.arrangeWay === ArrangeWay.vertical) {
        height -= 28
      }
      this.scrollHeight = height
    },
    handleKeydownAction (event: KeyboardEvent) {
      const code = event.code
      if (code === 'KeyA') { // cmd + a
        this.handleCommandAEvent(event)
      } else if (code === 'Backspace') {
        this.handleDeleteEvent(event)
      }
    },
    handleCommandAEvent (event: KeyboardEvent) {
      const isCommand = process.platform === 'darwin'
      event.stopPropagation()
      if (isCommand && event.metaKey === true) {
        event.preventDefault()
        this.$emit('callbackAction', 'selectAllItems')
      } else if (event.ctrlKey === true) {
        event.preventDefault()
        this.$emit('callbackAction', 'selectAllItems')
      }
    },
    handleDeleteEvent (event: KeyboardEvent) {
      event.stopPropagation()
      let hasSelected = false
      let hasRenaming = false
      for (let index = 0; index < this.dataSource.length; index++) {
        const item = this.dataSource[index] as ResourceItem
        if (hasSelected === false && item.isSelected === true) {
          hasSelected = true
        }
        if (hasRenaming === false && item.renaming === true) {
          hasRenaming = true
        }
      }
      if (hasSelected === false || hasRenaming === true) return
      event.preventDefault()
      this.$emit('callbackAction', 'delelteItems')
    },
    handleInfiniteOnLoad () {
      if (this.busy) return
      if (_.isEmpty(this.dataSource)) return
      this.$emit('callbackAction', 'loadmore')
    },
    handleListContextMenu (event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      this.$emit('callbackAction', 'contextMenu', event)
    },
    handleListClick (event: MouseEvent) {
      this.$emit('callbackAction', 'click')
    },
    handleDragEnterEvent (event: DragEvent) {
      if (!this.isSupportDrag) return
      this.dragState = true
    },
    handleDragLeaveEvent (event: DragEvent) {
      if (!this.isSupportDrag) return
      this.dragState = false
    },
    handleDragoverEvent (event: DragEvent) {
      if (!this.isSupportDrag) return // 检测是否支持拖拽上传
      if (event.dataTransfer === null) return
      if (!this.dragState) this.dragState = true
      event.dataTransfer.dropEffect = 'copy'
    },
    handleDropEvent (event: DragEvent) {
      if (!this.isSupportDrag) return
      this.dragState = false
      if (event.dataTransfer === null) return
      const files = event.dataTransfer.files
      let paths: string[] = []
      for (let index = 0; index < files.length; index++) {
        const element = files[index]
        paths.push(StringUtility.convertR2L(element.path))
      }
      this.$emit('callbackAction', 'drop', paths)
    }
  }
})
</script>

<style lang="less" scoped>
.resource-list {
  width: 100%;
  height: 100%;
  background-color: white;
  overflow-y: auto;
  overflow-x: hidden;
}
.horizontalResourceList {
  padding: 20px;
  background-color: white;
}
.drag-style {
  background-color: #def1ea;
}
.ant-col {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<style>
.resource-list .ant-list-header {
  padding: 0px;
}
.resource-list .ant-list-item {
  margin: 0px;
}
.resource-list .ant-list-empty-text {
  padding-top: 15%;
}
.ant-list-grid .ant-col > .ant-list-item {
  margin-bottom: 0;
}
</style>
