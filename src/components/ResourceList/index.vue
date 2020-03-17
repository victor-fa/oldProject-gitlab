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
      @click="listClick"
    >
      <a-list
        :dataSource="currentShowList"
        :grid="grid"
      >
        <a-list-item
          slot="renderItem"
          slot-scope="item, index"
          @click.stop.native.exact="singleSelectItem(index)"
          @click.shift.native.stop="multipleSelectItem(index)"
          @dblclick="doubleClickItem(item)"
          @contextmenu.prevent="didOperatItem($event, index)"
        >
          <resource-list-item
            :model="item"
            :index="index"
            :arrangeWay="arrangeWay"
            :isSelected="item.isSelected"
          />
        </a-list-item>
      </a-list>
    </div>
    <operate-list-alter
      ref="operateListAlter"
      :style="alterStyle"
    />
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import infiniteScroll from 'vue-infinite-scroll'
import { EventBus, EventType } from '../../utils/eventBus'
import processCenter, { EventName } from '../../utils/processCenter'
import { ArrangeWay, ResourceType, ResourceItem } from '../../api/NasFileModel'
import { CategoryType } from '../../components/BasicHeader/Model/categoryList'
import ResourceListItem from './ResourceListItem.vue'
import ResourceHeader from './ResourceHeader.vue'
import OperateListAlter from '../OperateListAlter/index.vue'

export default Vue.extend({
  name: 'resource-list',
  directives: { infiniteScroll },
  components: {
    ResourceListItem,
    ResourceHeader,
    OperateListAlter
  },
  props: {
    dataSource: Array,
    busy: {
      type: Boolean,
      default: false
    }
  },
  data () {
    let list = this.dataSource as Array<ResourceItem>
    return {
      scrollHeight: 450,
      arrangeWay: ArrangeWay.horizontal,
      currentShowList: list,
      alterPosition: { left: '0px', top: '0px' }
    }
  },
  watch: {
    dataSource: function (newValue, oldValue) {
      this.currentShowList = newValue
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
    },
    alterStyle: function (): object {
      return {
        left: this.alterPosition.left,
        top: this.alterPosition.top
      }
    }
  },
  mounted () {
    window.addEventListener('resize', this.observerWindowResize)
    this.observerEventBus()
    this.observerWindowResize()
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
        this.$store.dispatch('Resource/popPath')
        this.$emit('callbackAction', CallbackAction.back)
      })
      EventBus.$on(EventType.categoryChangeAction, (type: CategoryType) => {
        this.currentShowList = this.filterCurrentArray(type)
      })
      EventBus.$on(EventType.arrangeChangeAction, (way: ArrangeWay) => {
        this.arrangeWay = way
      })
    },
    filterCurrentArray (type: CategoryType) {
      let newArray: Array<ResourceItem> = []
      for (let index = 0; index < this.dataSource.length; index++) {
        const element = this.dataSource[index] as ResourceItem
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
          if (rtype !== ResourceType.image && rtype !== ResourceType.video && rtype !== ResourceType.audio && rtype !== ResourceType.floder) {
            return true
          }
          break
      }
      return false
    },
    handleInfiniteOnLoad () {
      if (_.isEmpty(this.dataSource)) return
      this.$emit('callbackAction', CallbackAction.loadMoreData)
    },
    listClick () {
      // reset select state
      for (let index = 0; index < this.currentShowList.length; index++) {
        const element = this.currentShowList[index]
        if (!element.isSelected) continue
        element.isSelected = false
        this.currentShowList.splice(index, 1, element)
      }
    },
    singleSelectItem (aIndex: number) {
      this.setSelectState(aIndex, true)
    },
    multipleSelectItem (index: number) {
      this.autoHideAlter()
      const item = this.currentShowList[index]
      item.isSelected = !item.isSelected
      this.currentShowList.splice(index, 1, item)
    },
    doubleClickItem (item: ResourceItem) {
      this.autoHideAlter()
      switch (item.type) {
        case ResourceType.floder:
          this.openFolder(item)
          break
        default:
          break
      }
    },
    openFolder (item: ResourceItem) {
      // change path
      this.$store.dispatch('Resource/pushPath', item.name)
      // notify parent component
      this.$emit('callbackAction', CallbackAction.openFolder, item)
    },
    // 设置aIndex对应item的选中状态
    // isNot 标记是否取反,如果为true，就取反aIndex对应的item，否则将aIndex对应的item置为true
    setSelectState (aIndex: number, isNot: boolean) {
      for (let index = 0; index < this.currentShowList.length; index++) {
        const element = this.currentShowList[index]
        // set selecte state of the current item
        if (index === aIndex) {
          element.isSelected = isNot ? !element.isSelected : true
          this.currentShowList.splice(index, 1, element)
          continue
        }
        // reset selete state of the other item 
        if (element.isSelected) {
          element.isSelected = false
          this.currentShowList.splice(index, 1, element)
        }
      }
    },
    didOperatItem (event: MouseEvent, aIndex: number) {
      event.preventDefault()
      this.setSelectState(aIndex, false)
      const alter: any = this.$refs.operateListAlter
      alter.showAlter()
      const point = this.getClickPoint(event)
      this.alterPosition = this.calculateSafePosition(point.x, point.y)
      // TODO: 不同type的item会展示不同的右键菜单
    },
    getClickPoint (event: MouseEvent) {
      const listX = (this.$el.getBoundingClientRect() as DOMRect).x
      const listY = (this.$el.getBoundingClientRect() as DOMRect).y
      return { x: event.clientX - listX, y: event.clientY - listY }
    },
    // 计算在window内的安全点
    calculateSafePositionOnWindow (clientX: number, clientY: number) {
      const width = document.body.clientWidth
      const height = document.body.clientHeight
      const paddingRight = 10; const paddingBottom = 17
      const alterWidth = 100 + paddingRight
      const alterHeight = 189 + paddingBottom
      let left = clientX + alterWidth < width ? clientX : width - alterWidth
      let top = clientY + alterHeight < height ? clientY : height - alterHeight
      return { left: left + 'px', top: top + 'px' }
    },
    // 计算在list内的安全点
    calculateSafePosition (clientX: number, clientY: number) {
      const width = this.$el.clientWidth
      const height = this.$el.clientHeight
      const padding = 3
      const alterWidth = 100 + padding
      const alterHeight = 189 + padding
      let left = clientX + alterWidth < width ? clientX : width - alterWidth
      let top = clientY + alterHeight < height ? clientY : height - alterHeight
      return { left: left + 'px', top: top + 'px' }
    },
    autoHideAlter () {
      const alter: any = this.$refs.operateListAlter
      alter.hideAlter()
    }
  }
})

enum CallbackAction {
  back = 'back',
  openFolder = 'openFolder',
  loadMoreData = 'loadMoreData'
}

export {
  CallbackAction
}

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
