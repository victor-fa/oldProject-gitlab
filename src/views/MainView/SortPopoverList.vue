<template>
  <div class="sort-popover">
    <ul>
      <li
        v-for="(item, index) in sortList.kinds"
        :key="index"
        class="sort-item"
        @click="sortKindChange(item)"
      >
      <label class="sort-title">{{ item.title }}</label>
      <img
        v-if="item.isSelected"
        class="accsory-icon"
        src="../../assets/sort_select_icon.png"
      />
      </li>
    </ul>
    <div class="split-line"/>
    <ul>
      <li
        v-for="(item, index) in sortList.types"
        :key="index"
        class="sort-item"
        @click="sortTypeChange(item)"
      >
      <label class="sort-title">{{ item.title }}</label>
      <img
        v-if="item.isSelected"
        class="accsory-icon"
        src="../../assets/sort_select_icon.png"
      />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { sortList, SortKindItem, SortTypeItem } from '../../model/sortList'

export default Vue.extend({
  name: 'sort-popover',
  data () {
    return {
      sortList,
      sortKind: sortList.kinds[0],
      sortType: sortList.types[0]
    }
  },
  methods: {
    sortKindChange (sender: SortKindItem) {
      if (sender.isSelected) { return }
      sender.isSelected = true
      this.sortKind.isSelected = false
      this.sortKind = sender
      let parameters = { kind: sender.kind, type: this.sortType.type }
      this.$emit('sortWayChange', parameters)
    },
    sortTypeChange (sender: SortTypeItem) {
      if (sender.isSelected) { return }
      sender.isSelected = true
      this.sortType.isSelected = false
      this.sortType = sender
      let parameters = { kind: this.sortKind.kind, type: sender.type }
      this.$emit('sortWayChange', parameters)
    }
  }
})
</script>

<style lang="less" scoped>
.sort-popover {
  padding: 0px;
  .sort-item {
    padding: 0px 16px;
  }
  .sort-title {
    display: inline-block;
    width: 36px;
    font-size: 12px;
    color: #484848;
    line-height: 24px;
  }
  .accsory-icon {
    width: 10px;
    margin-left: 7px;
  }
  .split-line {
    height: 1px;
    margin: 4px 10px;
    background-color: #01B74F;
  }
}
</style>

<style>
.ant-popover-inner-content {
  padding: 6px 0px;
}
</style>
