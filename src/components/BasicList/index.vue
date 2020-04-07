<template>
  <div
    class="transport-list"
    :style="{ height: scrollHeight + 'px' }"
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
import Vue from 'vue'

export default Vue.extend({
  name: 'basic-list',
  props: {
    dataSource: Array,
    adjust: Number
  },
  data () {
    return {
      scrollHeight: document.body.clientHeight - this.adjust
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
      const newHeight = document.body.clientHeight - this.adjust
      if (newHeight !== this.scrollHeight) {
        this.scrollHeight = newHeight
      }
    }
  }
})
</script>

<style lang="less" scoped>
.transport-list {
  background-color: white;
  overflow: hidden;
}
</style>

<style>
.transport-list .ant-list-header {
  padding: 0px;
}
.transport-list .ant-list-item {
  margin: 0px;
  padding: 0px;
}
</style>
