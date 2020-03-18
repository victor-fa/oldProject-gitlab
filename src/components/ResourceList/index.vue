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
          @contextmenu.prevent="handleContextMenu($event, index)"
        >
          <resource-list-item
            :ref="item.name"
            :model="item"
            :index="index"
            :arrangeWay="arrangeWay"
            :isSelected="item.isSelected"
          />
        </a-list-item>
      </a-list>
    </div>
    <operate-list-alter
      v-if="showAlter"
      ref="operateListAlter"
      :style="alterStyle"
      v-on:didSelectItem="handleAlterAction"
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
import ResourceHandler from './ResourceHandler'

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
      alterPosition: { left: '0px', top: '0px' },
      showAlter: false
    }
  },
  watch: {
    dataSource: function (newValue, oldValue) {
      this.currentShowList = newValue
    },
    currentShowList: function (newValue) {
      this.$store.dispatch('Resource/updateShowItemCount', newValue.length)
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
    getSelectItems () {
      let items: Array<ResourceItem> = []
      for (let index = 0; index < this.currentShowList.length; index++) {
        const element = this.currentShowList[index]
        if (element.isSelected) items.push(element)
      }
      return items
    },
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
        this.currentShowList = ResourceHandler.classifyArray((this.dataSource as Array<ResourceItem>), type)
      })
      EventBus.$on(EventType.arrangeChangeAction, (way: ArrangeWay) => {
        this.arrangeWay = way
      })
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
      this.autoHideAlter()
    },
    singleSelectItem (aIndex: number) {
      this.autoHideAlter()
      ResourceHandler.setSelectState(this.currentShowList, aIndex, true)
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
    handleContextMenu (event: MouseEvent, aIndex: number) {
      event.preventDefault()
      ResourceHandler.setSelectState(this.currentShowList, aIndex, false)
      this.showAlter = true
      const alter = this.$refs.showAlter as Element
      this.alterPosition = ResourceHandler.calculateSafePosition(event, this.$el, alter)
      // TODO: 不同文件类型和不同场景会展示不同的右键菜单
    },
    autoHideAlter () {
      this.showAlter = false
    },
    handleAlterAction (command: string) {
      this.autoHideAlter()
      switch (command) {
        case 'open':
          console.log('123')
          break;
        case 'rename':
          this.handleRenameAction()
          break
        default:
          break;
      }
    },
    handleRenameAction () {
      // 只能对单个item命名
      const item = _.head(this.getSelectItems())
      if (item === undefined) return
      const listItem: any = this.$refs[item.name]
      listItem.beginRenaming()
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
