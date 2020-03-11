<template>
  <ul
    v-show="isShow"
    class="operate-list-alter"
  >
      <li
        v-for="(item, index) in operateList"
        :key="index"
        class="operate-group"
      >
        <img :src="item.icon">
        <ul class="operate-items">
          <li
            v-for="(subItem, index) in item.items"
            :key="index"
            @click="menuClick(subItem.commend, subItem.title)"
            class="operate-item"
          >
            {{ subItem.title }}
          </li>
        </ul>
      </li>
    </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import { operateList } from './operateList'

export default Vue.extend({
  name: 'operate-list-alter',
  data () {
    return {
      operateList,
      isShow: false
    }
  },
  destroyed () {
    window.removeEventListener('click', this.windowClick)
  },
  methods: {
    windowClick (event: MouseEvent) {
      if (!this.isShow) { return }
      event.stopImmediatePropagation()
      this.hideAlter()
    },
    menuClick (commend: String, title: String) {
      this.$emit('callback', commend, title)
      this.hideAlter()
    },
    showAlter () {
      this.isShow = true
    },
    hideAlter () {
      this.isShow = false
    }
  },
  mounted () {
    window.addEventListener('click', this.windowClick)
  }
})
</script>

<style lang="less" scoped>
.operate-list-alter {
  position: absolute;
  width: 100px;
  height: 189px;
  border: 1px solid #acacb7;
  background-color: white;
  .operate-group {
    display: flex;
    align-items: flex-start;
    img {
      width: 10px;
      margin: 6px 6px 0px;
    }
    .operate-items {
      flex: 1;
      padding: 3px 0px;
      border-left: 1px solid #acacac;
      border-bottom: 1px solid #acacb7;
      .operate-item {
        display: flex;
        flex: 1;
        padding: 0px 8px;
        color: #484848;
        font-size: 10px;
        line-height: 16px;
      }
      .operate-item:hover {
        background-color: gray;
      }
    }
  }
}
</style>
