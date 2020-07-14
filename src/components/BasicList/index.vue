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
      :grid="{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }"
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
    busy: {
      default: false
    },
    adjust: Number
  },
  data () {
    return {
      scrollHeight: document.body.clientHeight - this.adjust
    }
  },
  watch: {
    adjust: function (newValue: number) {
      this.scrollHeight = document.body.clientHeight - this.adjust
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
      this.scrollHeight = document.body.clientHeight - this.adjust
    },
    handleInfiniteOnLoad () {
      if (this.busy) return
      if (_.isEmpty(this.dataSource)) return
      this.$emit('loadMoreData')
    }
  }
})
</script>

<style lang="less" scoped>
.basic-list {
  width: 100%;
  height: 100%;
  background-color: white;
  overflow-y: auto;
  overflow-x: hidden;
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
.basic-list .ant-list-empty-text {
  padding-top: 15%;
}
</style>
