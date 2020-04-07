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
  height: 28px;
  margin-left: 20px;
  list-style: none;
  display: flex;
  justify-content: flex-start;
  cursor: pointer;
  li {
    display: inline-block;
    color: #484848;
    font-weight: bold;
    font-size: 14px;
    width: 84px;
    padding: 0 14px;
    height: 25px;
    line-height: 25px;
    margin-bottom: 10px;
  }
  .split-line {
    height: 4px;
    width: 55px;
    background-color: #01B74F;
    border-radius: 2px;
    margin: 0px;
  }
}
</style>
