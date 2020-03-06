<template>
  <ul>
    <li
      v-for="(item, index) in funcListRouters"
      :key="index"
      class="item"
      v-bind:class="{ itemSelected: item.meta.isSelected }"
      @click="onSelectAction(item.meta, item.path)"
    >
      <img :src="item.meta.isSelected ? item.meta.selectedIcon : item.meta.icon"/>
      <label>{{ item.meta.title }}</label>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import { funcListRouters, FuncListItem } from '../../router/modules/funclist'
import router from '../../router'
import { EventBus, EventType } from '../../utils/eventBus'

export default Vue.extend({
  data () {
    return {
      funcListRouters,
      selectedItem: funcListRouters[0].meta
    }
  },
  methods: {
    onSelectAction: function (item: FuncListItem, path: string) {
      if (item.isSelected) { return }
      item.isSelected = true
      this.selectedItem.isSelected = false
      this.selectedItem = item
      EventBus.$emit(EventType.leftMenuChangeAction, path)
      router.replace(path)
    }
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
