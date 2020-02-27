<template>
  <ul class="middle-bar">
    <li
    v-for="(item, index) in categorys"
    :key="index"
    v-bind:class="{ itemSelected: item.isSelected }"
    @click="onSelectAction(item)">
      {{ item.title }}
      <a-divider class="split-line" v-show="item.isSelected"/>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import { categorys, Category } from './Model/categoryList'
import { EventBus, EventType } from '../../utils/eventBus'

export default Vue.extend({
  name: 'middle-bar',
  data () {
    return {
      categorys,
      currentCategory: categorys[0]
    }
  },
  methods: {
    onSelectAction: function (item: Category): void {
      if (item.isSelected) { return }
      // TODO: 现将所有置为未选中，调试状态总是出问题
      this.currentCategory.isSelected = false
      item.isSelected = true
      this.currentCategory = item
      EventBus.$emit(EventType.categoryChangeAction, item.type)
    }
  }
})
</script>

<style lang="less" scoped>
.middle-bar {
  height: 28px;
  margin-left: 20px;
  list-style: none;
  display: flex;
  justify-content: flex-start;
  li {
    display: inline-block;
    color: #484848;
    font-weight: bold;
    font-size: 14px;
    width: 60px;
    line-height: 25px;
    margin-bottom: 10px;
  }
  .split-line {
    height: 4px;
    width: 60px;
    background-color: #007934;
    border-radius: 2px;
    margin: 0px;
  }
}
</style>
