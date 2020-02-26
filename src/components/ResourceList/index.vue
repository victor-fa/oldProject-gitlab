<template>
  <div
    class="resource-list"
    :style="{ height: scrollHeight + 'px' }"
    v-infinite-scroll="handleInfiniteOnLoad"
    :infinite-scroll-disabled="busy"
    :infinite-scroll-distance="10"
  >
    <a-list
      :dataSource="currentArray"
      :grid="{ gutter: 16, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, xxl: 24 }"
    >
      <a-list-item
        v-if="arrangeWay === 0"
        slot="renderItem"
        slot-scope="item"
        @dblclick="didSelectItem(item)"
      >
        <div class="horizontal-item">
          <img :src="searchResourceIcon(item.type)"/>
          <span>{{ item.name }}</span>
        </div>
      </a-list-item>
      <div v-if="loading && !busy" class="demo-loading-container">
        <a-spin />
      </div>
    </a-list>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import infiniteScroll from 'vue-infinite-scroll'
import { ReadStream } from 'fs'
import { EventBus } from '../../utils/eventBus'
import { BACK_ACTION, CATEGORY_CHANGE_ACTION } from '../../common/constants'
import { ArrangeWay, ResourceType, ResourceItem } from './resourceModel'
import { CategoryType } from '../../components/BasicHeader/Model/categoryList'

export default Vue.extend({
  name: 'resource-list',
  directives: { infiniteScroll },
  props: {
    dataSource: {
      type: Array,
      validator: (value) => {
        for (let index = 0; index < value.length; index++) {
          const element = value[index]
          if (!(element as ResourceItem)) {
            return false
          }
        }
        return true
      }
    },
    arrangeWay: {
      type: Number,
      default: ArrangeWay.horizontal,
      validator: (value) => {
        return [ArrangeWay.horizontal, ArrangeWay.vertical].indexOf(value) !== -1
      }
    }
  },
  data () {
    return {
      loading: false,
      busy: false,
      scrollHeight: 450,
      currentArray: this.dataSource,
      directoryList: this.dataSource
    }
  },
  mounted () {
    window.addEventListener('resize', (event: any): void => {
      const newHeight = document.body.clientHeight - 128
      if (newHeight !== this.scrollHeight) {
        this.scrollHeight = newHeight
      }
    }, false)
    this.observerEventBus()
  },
  destroyed () {
    EventBus.$off(BACK_ACTION)
    EventBus.$off(CATEGORY_CHANGE_ACTION)
  },
  methods: {
    observerEventBus () {
      EventBus.$on(BACK_ACTION, () => {
        // TODO: 在有多级目录时，返回时应该找到上一级的目录列表赋给currentArray
        this.currentArray = this.dataSource
        this.$store.dispatch('popPath')
      })
      EventBus.$on(CATEGORY_CHANGE_ACTION, (type: CategoryType) => {
        this.currentArray = this.filterCurrentArray(type)
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
    searchResourceIcon (type: ResourceType) {
      switch (type) {
        case ResourceType.folder:
          return require('../../assets/resource/folder_icon.png')
        case ResourceType.html:
          return require('../../assets/resource/html_icon.png')
        case ResourceType.image:
          return require('../../assets/resource/image_icon.png')
        case ResourceType.audio:
          return require('../../assets/resource/audio_icon.png')
        case ResourceType.video:
          return require('../../assets/resource/video_icon.png')
        case ResourceType.pdf:
          return require('../../assets/resource/pdf_icon.png')
        case ResourceType.txt:
          return require('../../assets/resource/txt_icon.png')
      }
      return require('../../assets/resource/unkonw_icon.png')
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
  background-color: white;
  overflow: auto;
  padding: 20px 20px 0px;
  .horizontal-item {
    padding: 20px 0px;
    img {
      width: 35px;
      height: 29px;
      margin-bottom: 20px;
    }
    span {
      display: block;
      font-size: 12px;
      line-height: 12px;
      color: #484848;
    }
  }
}
</style>
