<template>
  <ul class="middle-bar">
    <li
    v-for="(item, index) in currentArr"
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
import { categorys, taskCategorys, Category } from './Model/categoryList'
import { EventBus, EventType } from '../../utils/eventBus'

export default Vue.extend({
  name: 'middle-bar',
  data () {
    return {
      currentArr: categorys,
      currentCategory: categorys[0]
    }
  },
  mounted () {
    this.observerEventBus()
    EventBus.$emit(EventType.categoryChangeAction, 'all')
  },
  methods: {
    onSelectAction: function (item: any): void {
      if (item.isSelected) { return }
      this.currentArr.forEach(cell => { cell.isSelected = false })  // 清空所有已选状态
      item.isSelected = true
      this.currentCategory = item
      EventBus.$emit(EventType.categoryChangeAction, item.type)
    },
    observerEventBus () {
      EventBus.$on(EventType.leftMenuChangeAction, (path: any) => {
        // console.log(path);
        taskCategorys.forEach(cell => { cell.isSelected = false })
        taskCategorys[0].isSelected = true
        if (path === '/transport') {
          this.currentArr = taskCategorys;
          this.currentCategory = taskCategorys[0];
        } else {
          this.currentArr = categorys;
          this.currentCategory = categorys[0];
        }
      })
    }
  },
  destroyed () {
    EventBus.$off(EventType.leftMenuChangeAction)
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
  cursor: pointer;
  li {
    display: inline-block;
    color: #484848;
    font-weight: bold;
    font-size: 14px;
    width: 84px;
    padding: 0 14px;
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
