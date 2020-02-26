<template>
  <ul>
    <li
      v-for="(item, index) in funcListRouters"
      :key="index"
      class="item"
      v-bind:class="{ itemSelected: item.meta.isSelected }"
      @click="onSelectAction(item.meta)"
    >
      <router-link :to="item.path">
        <img :src="item.meta.isSelected ? item.meta.selectedIcon : item.meta.icon"/>
        <label>{{ item.meta.title }}</label>
      </router-link>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import { funcListRouters, FuncListItem } from '../../router/modules/funclist'

export default Vue.extend({
  data () {
    return {
      funcListRouters,
      selectedItem: funcListRouters[0].meta
    }
  },
  methods: {
    onSelectAction: function (item: FuncListItem) {
      if (item.isSelected) { return }
      item.isSelected = true
      this.selectedItem.isSelected = false
      this.selectedItem = item
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
  img {
    width: 16px;
    margin-right: 18px;
  }
  label {
    display: inline-block;
    font-size: 14px;
    font-weight: bold;
    color: #484848;
    width: 100px;
    text-align: left;
  }
}
.itemSelected {
  background-color: #06b65066;
  label {
    color: #007934;
  }
}
</style>
