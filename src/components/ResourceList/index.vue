<template>
  <div>
    <resource-header v-if="isShowHeader"/>
    <div
      class="resource-list"
      v-bind:class="{ horizontalResourceList: !isShowHeader }"
      :style="{ height: scrollHeight + 'px' }"
      v-infinite-scroll="handleInfiniteOnLoad"
      :infinite-scroll-disabled="busy"
      :infinite-scroll-distance="0"
      :infinite-scroll-immediate-check="false"
      @contextmenu.prevent="handleListContextMenu"
      @click="handleListClick"
    >
      <a-list
        :dataSource="dataSource"
        :grid="grid"
      >
        <a-list-item
          slot="renderItem"
          slot-scope="item, index"
        >
          <resource-list-item
            :ref="item.name"
            :model="item"
            :index="index"
            :arrangeWay="arrangeWay"
            :isSelected="item.isSelected"
            :disable="item.disable"
            v-on:singleSelectClick="singleSelectItem"
            v-on:multipleSelectClick="multipleSelectItem"
            v-on:listMultipleSelectClick="listMultipleSelectItem"
            v-on:doubleClick="doubleClickItem"
            v-on:contextMenuClick="handleContextMenu"
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
import { EventBus, EventType } from '../../utils/eventBus'
import processCenter, { EventName } from '../../utils/processCenter'
import { ArrangeWay, ResourceType, ResourceItem } from '../../api/NasFileModel'
import { CategoryType } from '../../model/categoryList'
import ResourceListItem from './ResourceListItem.vue'
import ResourceHeader from './ResourceHeader.vue'
import { SortWay } from '../../model/sortList'

export default Vue.extend({
  name: 'resource-list',
  directives: { infiniteScroll },
  components: {
    ResourceListItem,
    ResourceHeader
  },
  props: {
    dataSource: Array,
    busy: {
      type: Boolean,
      default: false
    },
    arrangeWay: {
      type: Number,
      validator: function (value) {
        return [ArrangeWay.horizontal, ArrangeWay.vertical].indexOf(value) !== -1
      }
    }
  },
  data () {
    return {
      scrollHeight: document.body.clientHeight - 122
    }
  },
  watch: {
    arrangeWay: function (newValue) {
      const asjust = newValue === ArrangeWay.horizontal ? 28 : -28
      this.scrollHeight += asjust
    } 
  },
  computed: {
    grid: function () {
      if (this.arrangeWay === ArrangeWay.horizontal) {
        return { gutter: 16, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, xxl: 24 }
      }
      return { gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }
    },
    isShowHeader: function () {
      if (this.arrangeWay === ArrangeWay.vertical) {
        return true
      }
      return false
    }
  },
  mounted () {
    window.addEventListener('resize', this.observerWindowResize)
  },
  destroyed () {
    window.removeEventListener('resize', this.observerWindowResize)
  },
  methods: {
    observerWindowResize () {
      const adjust = this.arrangeWay === ArrangeWay.horizontal ? 122 : 150
      const newHeight = document.body.clientHeight - adjust
      if (newHeight !== this.scrollHeight) {
        this.scrollHeight = newHeight
      }
    },
    handleInfiniteOnLoad () {
      if (_.isEmpty(this.dataSource)) return
      this.$emit('CallbackAction', ResourceListAction.loadMoreData)
    },
    singleSelectItem (aIndex: number) {
      this.$emit('CallbackAction', ResourceListAction.singleSelectItem, aIndex)
    },
    multipleSelectItem (index: number) {
      this.$emit('CallbackAction', ResourceListAction.multipleSelectItem, index)
    },
    listMultipleSelectItem (index: number) {
      this.$emit('CallbackAction', ResourceListAction.listMultipleSelectItem, index)
    },
    doubleClickItem (index: number) {
      const item = this.dataSource[index] as ResourceItem
      switch (item.type) {
        case ResourceType.floder:
          this.$emit('CallbackAction', ResourceListAction.openItem, index)
          break
        default:
          break
      }
    },
    handleContextMenu (event: MouseEvent, aIndex: number) {
      this.$emit('CallbackAction', ResourceListAction.contextMenu, event, aIndex)
    },
    handleListContextMenu (event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      this.$emit('CallbackAction', ResourceListAction.listContextMenu, event)
    },
    handleListClick (event: MouseEvent) {
      event.stopPropagation()
      this.$emit('CallbackAction', ResourceListAction.listClick)
    },
    handleRenameAction (item: ResourceItem) {
      const listItem: any = this.$refs[item.name]
      listItem.beginRenaming()
    }
  }
})
enum ResourceListAction {
  loadMoreData = 'load_more_data',
  openItem = 'open_item',
  contextMenu = 'context_menu',
  listContextMenu = 'list_context_menu',
  singleSelectItem = 'single_select_item',
  multipleSelectItem = 'multiple_select_item',
  listMultipleSelectItem = 'list_multiple_select_item',
  listClick = 'list_click'
}
export {
  ResourceListAction
}
</script>

<style lang="less" scoped>
.resource-list {
  background-color: white;
  overflow: auto;
  .demo-loading-container {
    position: absolute;
    bottom: 40px;
    width: 100%;
    text-align: center;
  }
}
.horizontalResourceList {
  padding: 20px;
  background-color: white;
}
</style>

<style>
.resource-list .ant-list-header {
  padding: 0px;
}
.resource-list .ant-list-item {
  margin: 0px;
}
</style>
