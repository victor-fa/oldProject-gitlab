<template>
  <ul class="operate-list-alter" :style="{ height: listHeight + 'px'}">
      <li
        v-for="(item, index) in showItems"
        :key="index"
        class="operate-group"
      >
        <img :src="item.icon">
        <ul class="operate-items">
          <li
            v-for="(subItem, index) in item.items"
            :key="index"
            @click="menuClick(subItem)"
            v-bind:class="{ operateItemDisable: subItem.disable, operateItem: !subItem.disable }"
          >
            {{ subItem.title }}
          </li>
        </ul>
      </li>
    </ul>
</template>

<script lang="ts">
import Vue from 'vue'
import { OperateItem, OperateGroup } from './operateList'

export default Vue.extend({
  name: 'operate-list-alter',
  props: {
    operateList: Array
  },
  data () {
    let items: Array<OperateGroup> = []
    return {
      showItems: items
    }
  },
  watch: {
    operateList: function (newVlaue: Array<OperateGroup>) {
      this.showItems = newVlaue.filter(group => {
        let items: Array<OperateItem> = []
        for (let index = 0; index < group.items.length; index++) {
          const element = group.items[index]
          if (!element.hide) items.push(element)
        }
        if (items.length === 0) return false
        group.items = items
        return true
      })
    }
  },
  computed: {
    listHeight: function () {
      const marginCount = 6 * this.operateList.length
      const borderCount = 1 * (this.operateList.length + 1)
      let itemCount = 0
      for (let index = 0; index < this.operateList.length; index++) {
        const element = this.operateList[index] as OperateGroup
        for (let i = 0; i < element.items.length; i++) {
          const el = element.items[i];
          if (el.hide) continue
          itemCount += 16
        }
      }
      return marginCount + borderCount + itemCount
    },
    listWidth: function () {
      return 100
    }
  },
  methods: {
    menuClick (item: OperateItem) {
      this.$emit('didSelectItem', item.command)
    }
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
      .operateItem {
        display: flex;
        flex: 1;
        padding: 0px 8px;
        color: #484848;
        font-size: 10px;
        line-height: 16px;
      }
      .operateItem:hover {
        background-color: #DEF1EA;
      }
      .operateItemDisable {
        display: flex;
        flex: 1;
        padding: 0px 8px;
        color: #48484866;
        font-size: 10px;
        line-height: 16px;
        cursor:not-allowed;
      }
      .operateItemDisable:hover {
        background-color: #DEF1EA;
        cursor: not-allowed;
      }
    }
  }
}
</style>
