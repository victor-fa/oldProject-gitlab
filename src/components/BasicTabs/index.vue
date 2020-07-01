<template>
  <ul class="basic-tabs">
    <li
    v-for="(item, index) in currentArr"
    :key="index"
    v-bind:class="{ itemSelected: item.isSelected }"
    @click="onSelectAction(index)">
      {{ item.title }}
      <a-divider class="split-line" v-show="item.isSelected"/>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'basic-tabs',
  props: {
    tabs: Array
  },
  data () {
    let items = this.tabs as Array<BasicTabItem>
    return {
      currentArr: items
    }
  },
  watch: {
    currentArr: function (newValue) {
      this.currentArr = newValue
    }
  },
  methods: {
    onSelectAction: function (index: number) {
      const item = this.currentArr[index]
      if (item.isSelected) { return }
      this.currentArr = this.currentArr.map((item, aIndex) => {
        item.isSelected = aIndex === index ? true : false
        return item
      })
      this.$emit('tabChange', index)
    }
  }
})

interface BasicTabItem {
  title: string,
  isSelected?: boolean
}
export {
  BasicTabItem
}
</script>

<style lang="less" scoped>
.basic-tabs {
  height: 36px;
  padding-left: 18px;
  list-style: none;
  display: flex;
  justify-content: flex-start;
  background-color: #F8F9FC;
  border-bottom: 1px solid #BCC0CE40;
  li {
    display: inline-block;
    color: black;
    font-size: 14px;
    width: 56px;
    margin-right: 40px;
    height: 33px;
    line-height: 33px;
    cursor: pointer;
  }
  .split-line {
    height: 3px;
    width: 50px;
    background-color: #007934;
    border-radius: 1.5px;
    margin: 0px;
  }
}
</style>
