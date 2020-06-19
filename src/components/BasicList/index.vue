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
      scrollHeight: 0
    }
  },
  mounted () {
    window.addEventListener('resize', this.observerWindowResize)
    this.$nextTick(() => {
      this.scrollHeight = this.$parent.$parent.$el.clientHeight
    })
  },
  destroyed () {
    window.removeEventListener('resize', this.observerWindowResize)
  },
  methods: {
    observerWindowResize () {
      this.scrollHeight = this.$parent.$parent.$el.clientHeight
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
  height: 100%;
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
