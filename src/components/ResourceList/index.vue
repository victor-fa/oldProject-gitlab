<template>
  <div>
    <slot name="resourceHeader">
      <resource-header v-if="isShowHeader"/>
    </slot>
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
import { EventBus, EventType } from '../../utils/eventBus'
import processCenter, { EventName } from '../../utils/processCenter'
import { ArrangeWay, ResourceType, ResourceItem } from '../../api/NasFileModel'
import { CategoryType } from '../../model/categoryList'
import ResourceHeader from './ResourceHeader.vue'
import { SortWay } from '../../model/sortList'

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
      const grid = this.customGrid as object
      if (!_.isEmpty(grid)) return grid
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
    document.onkeyup = (event) => {
      if (event.keyCode === 13) { // enter
        this.$emit('callbackAction', 'enterRenaming')
      } else if (event.keyCode === 8) {
        this.$emit('callbackAction', 'deleteItems')
      }
    }
  },
  destroyed () {
    window.removeEventListener('resize', this.observerWindowResize)
    document.onkeyup = null
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
      this.$emit('callbackAction', 'loadmore')
    },
    handleListContextMenu (event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      this.$emit('callbackAction', 'contextMenu', event)
    },
    handleListClick (event: MouseEvent) {
      event.stopPropagation()
      this.$emit('callbackAction', 'click')
    }
  }
})
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
