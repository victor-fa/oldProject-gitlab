<template>
  <div
    class="basic-list"
    :style="{ height: scrollHeight + 'px' }"
    v-infinite-scroll="handleInfiniteOnLoad"
    :infinite-scroll-disabled="busy"
    :infinite-scroll-distance="0"
    :infinite-scroll-immediate-check="false"
  >
    <a-list
      itemLayout="horizontal"
      :dataSource="dataSource"
      :split="false"
    >
      <a-list-item slot="renderItem" slot-scope="item, index">
        <slot name="renderItem" :item="item" :index="index"/>
      </a-list-item>
    </a-list>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import infiniteScroll from 'vue-infinite-scroll'

export default Vue.extend({
  name: 'basic-list',
  directives: { infiniteScroll },
  props: {
    dataSource: Array,
    adjust: {
      default: 0
    },
    busy: {
      default: false
    }
  },
  watch: {
    adjust: function (newValue: number) {
      this.scrollHeight = document.body.clientHeight - newValue
    }
  },
  data () {
    return {
      scrollHeight: document.body.clientHeight - this.adjust
    }
  },
  mounted () {
    if (this.adjust > 0) {
      window.addEventListener('resize', this.observerWindowResize)
    }
  },
  destroyed () {
    if (this.adjust > 0) {
      window.removeEventListener('resize', this.observerWindowResize)
    }
  },
  methods: {
    observerWindowResize () {
      const newHeight = document.body.clientHeight - this.adjust
      if (newHeight !== this.scrollHeight) {
        this.scrollHeight = newHeight
      }
    },
    handleInfiniteOnLoad () {
      if (_.isEmpty(this.dataSource)) return
      this.$emit('loadMoreData')
    }
  }
})
</script>

<style lang="less" scoped>
.basic-list {
  background-color: white;
  overflow-x: hidden;
  overflow-y: scroll;
}
</style>

<style>
.basic-list .ant-list-header {
  padding: 0px;
}
.basic-list .ant-list-item {
  margin: 0px;
  padding: 0px;
}
</style>
