<template>
  <ul>
    <li
      v-for="(item, index) in silderItems"
      :key="index"
      class="item"
      v-bind:class="{ itemSelected: item.meta.isSelected }"
      @click="onSelectAction(index)"
    >
      <img :src="item.meta.isSelected ? item.meta.selectedIcon : item.meta.icon"/>
      <label>{{ item.meta.title }}
        <a-badge
          v-show="item.name === 'transport'"
          :count="taskCount"
          :numberStyle="{backgroundColor: '#01B74F', color: '#fff'}"
          style="float: right"
        >
        </a-badge>
      </label>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import { FuncListItem } from '../../router/modules/HomeList'

export default Vue.extend({
  name: 'sider-menu',
  model: {
    prop: 'selectedIndex',
    event: 'change'
  },
  props: {
    silderItems: Array,
    selectedIndex: Number,
    taskCount: {
      default: 0
    }
  },
  data () {
    return {
      showItems: this.silderItems as FuncListItem[]
    }
  },
  methods: {
    onSelectAction (aIndex: number) {
      if (this.selectedIndex === aIndex) return
      this.$emit('change', aIndex)
      this.showItems = this.showItems.map((item, index) => {
        item.meta!.isSelected = index === aIndex
        return item
      })
    },
  }
})
</script>

<style lang="less" scoped>
.item {
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0px 11px 0px 7px;
  cursor: pointer;
  border-radius: 4px;
  img {
    width: 16px;
    margin-right: 18px;
    cursor: pointer;
  }
  label {
    display: inline-block;
    font-size: 14px;
    font-weight: bold;
    color: #484848;
    width: 100px;
    text-align: left;
    cursor: pointer;
  }
}
.itemSelected {
  background-color: #DEF1EA;
  label {
    color: #007934;
  }
}
</style>
