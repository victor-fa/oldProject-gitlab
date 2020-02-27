<template>
  <div>
    <resource-header v-if="isShowHeader"/>
    <div
      class="resource-list"
      v-bind:class="{ horizontalResourceList: !isShowHeader }"
      :style="{ height: scrollHeight + 'px' }"
      v-infinite-scroll="handleInfiniteOnLoad"
      :infinite-scroll-disabled="busy"
      :infinite-scroll-distance="10"
    >
      <a-list
        :dataSource="currentArray"
        :grid="grid"
      >
        <a-list-item
          slot="renderItem"
          slot-scope="item, index"
          @dblclick="didSelectItem(item)"
        >
          <resource-item :model="item" :index="index" :arrangeWay="arrangeWay"/>
        </a-list-item>
        <div v-if="loading && !busy" class="demo-loading-container">
          <a-spin />
        </div>
      </a-list>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import infiniteScroll from 'vue-infinite-scroll'
import { EventBus, EventType } from '../../utils/eventBus'
import { ArrangeWay, ResourceType, ResourceItem } from './resourceModel'
import { CategoryType } from '../../components/BasicHeader/Model/categoryList'
import resourceItem from './resourceItem.vue'
import resourceHeader from './resourceHeader.vue'

export default Vue.extend({
  name: 'resource-list',
  directives: { infiniteScroll },
  components: {
    resourceItem,
    resourceHeader
  },
  props: {
    dataSource: Array
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
  data () {
    return {
      loading: false,
      busy: false,
      scrollHeight: 450,
      arrangeWay: ArrangeWay.horizontal,
      currentArray: this.dataSource,
      directoryList: this.dataSource
    }
  },
  mounted () {
    window.addEventListener('resize', this.observerWindowResize)
    this.observerEventBus()
  },
  destroyed () {
    window.removeEventListener('resize', this.observerWindowResize)
    EventBus.$off(EventType.backAction)
    EventBus.$off(EventType.categoryChangeAction)
    EventBus.$off(EventType.arrangeChangeAction)
  },
  methods: {
    observerWindowResize () {
      const newHeight = document.body.clientHeight - 128
      if (newHeight !== this.scrollHeight) {
        this.scrollHeight = newHeight
      }
    },
    observerEventBus () {
      EventBus.$on(EventType.backAction, () => {
        // TODO: 在有多级目录时，这里应该设置一个数据栈
        this.currentArray = this.dataSource
        this.directoryList = this.currentArray
        this.$store.dispatch('popPath')
      })
      EventBus.$on(EventType.categoryChangeAction, (type: CategoryType) => {
        this.currentArray = this.filterCurrentArray(type)
      })
      EventBus.$on(EventType.arrangeChangeAction, (way: ArrangeWay) => {
        this.arrangeWay = way
      })
    },
    filterCurrentArray (type: CategoryType) {
      let newArray: Array<ResourceItem> = []
      for (let index = 0; index < this.directoryList.length; index++) {
        const element = this.directoryList[index] as ResourceItem
        if (this.isInclude(type, element.type)) {
          newArray.push(element)
        }
      }
      return newArray
    },
    isInclude (ctype: CategoryType, rtype: ResourceType) {
      switch (ctype) {
        case CategoryType.all:
          return true
        case CategoryType.image:
          if (rtype === ResourceType.image) {
            return true
          }
          break
        case CategoryType.video:
          if (rtype === ResourceType.video) {
            return true
          }
          break
        case CategoryType.audio:
          if (rtype === ResourceType.audio) {
            return true
          }
          break
        case CategoryType.document:
          if (rtype !== ResourceType.image && rtype !== ResourceType.video && rtype !== ResourceType.audio && rtype !== ResourceType.folder) {
            return true
          }
          break
      }
      return false
    },
    handleInfiniteOnLoad () {
      console.log('load more data')
    },
    didSelectItem (item: ResourceItem) {
      switch (item.type) {
        case ResourceType.folder:
          this.openFolder(item)
          break
        default:
          break
      }
    },
    openFolder (item: ResourceItem) {
      // reload data
      this.currentArray = item.subResources !== undefined ? item.subResources : []
      this.directoryList = this.currentArray
      // change path
      this.$store.dispatch('pushPath', item.name)
    }
  }
})
</script>

<style lang="less" scoped>
.resource-list {
  overflow: auto;
  .demo-loading-container {
    position: absolute;
    bottom: 40px;
    width: 100%;
    text-align: center;
  }
}
.horizontalResourceList {
  padding: 20px 20px 0px;
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
